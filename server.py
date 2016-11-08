from flask import Flask, render_template, make_response, request,session,redirect,url_for
import json
import networkx as nx
from networkanalysis.Analysis import Retrievor
from user_Feedback.recordUser import record_thread,error_thread,userQuestion
from Private import PF
import time
from time import gmtime, strftime


app = Flask(__name__)
app.secret_key='\x8b\x19\xa1\xb0D\x87?\xc1M\x04\xff\xc8\xbdE\xb1\xca\xe6\x9e\x8d\xb3+\xbe>\xd2'

# Initial Data
# whole retrievor, use whole database as its own graph
#myRtr=Retrievor.UndirectedG('addNodeEdgeDegree_R+rn+GMHM_undirected_alpha0.65_nodeD1.0_total_v3_csvneo4j','total_v3_csvneo4j','userdata')
myRtr=Retrievor.UndirectedG('undirected(fortest)_R+G+SP+C+c','fortest','userdata')
print 'edges: ', len(myRtr.G.edges())
print 'nodes: ', len(myRtr.G.nodes())

# sign up
@app.route('/signup')
def signup():
    session['firstTimeVisit'] = True
    user = request.args.get('email','')
    w = request.args.get('w','')
    session['user'] = user
    session['w'] = w
    fusers = open('allusers.txt', mode='a')
    fusers.write(user+'\n')
    fusers.close()
    return redirect('/')


# Main Page
@app.route('/')
def index():
    if 'user' in session:
        print session['w']
        print session['user']
        w=session['w']
        if int(w)<=750:
            print 'moble'
            return make_response(open('m-index.html').read())
        else:
            return make_response(open('index.html').read())
    else:
        return make_response(open('signup.html').read())

@app.route('/mobile')
def mobile():
    return make_response(open('m-index.html').read())

# get text return nodes number
@app.route('/texttowid/<info>')
def texttowid(info):
    info = json.loads(info)
    searchtext = info['searchtext']
    distance = 'None'
    searchtext = searchtext.encode('utf-8')
    ipts = [word.strip() for word in searchtext.split(';')]
    try:
        wids=myRtr.input_ids(ipts)
    except:
        #record the word which can't be found. error
        errthread = error_thread(myRtr.userSchema,myRtr.data_version,distance,session['user'],'search','null',ipts[0],'null','null')
        errthread.start()

        raise ValueError("Input NOT Found")

    labels = [myRtr.G.node[wid]['label'] for wid in wids]

    # record user activity
    user = session['user']
    rthread=record_thread(myRtr.userSchema,myRtr.data_version,distance,user,'search',wids,labels,1)
    rthread.start()

    response=json.dumps(wids[0])
    return make_response(response)

# search button, add one node
@app.route('/searchbutton/<info>')
def search(info):
    info = json.loads(info)
    distance = info['tp']
    localG = myRtr.G.subgraph(set(info['currentnodes']+info['query']))
    allnodes = [
        {"wid": n, "label": localG.node[n]["label"], "N": localG.degree(n, weight="weight"), "n": localG.degree(n)} for
        n in localG.nodes()]
    alledges = [{"source": source, "target": target, 'dist': dist} for (source, target, dist) in localG.edges(data=distance)]
    sorted_paths = sorted(localG.edges(nbunch=info['query'],data=distance), key=lambda x:x[2])
    add_paths = [path[:-1] for path in sorted_paths]
    try:
        bi = 0
        bornnode = sorted_paths[bi][1]
        while bornnode in info['query']:
            bi +=1
            bornnode = sorted_paths[bi][1]
    except:
        bornnode = None

    dataset = {"allnodes": allnodes, "alledges": alledges, "paths": add_paths,'bornnode':bornnode}
    response = json.dumps(dataset)
    return make_response(response)

# find the nearest node of the current nodes to the query node
@app.route('/findnear/<info>')
def findnear(info):
    info = json.loads(info)
    query = info['query']
    localG = myRtr.G.subgraph(set(info['currentnodes'] + [query]))
    sorted_neighbors = sorted([(n,localG[query][n]['Fw']) for n in localG.neighbors(query)] , key=lambda x:x[1])
    try:
        bornnode = sorted_neighbors[0][0]
    except:
        bornnode = None

    response = json.dumps(bornnode)
    return make_response(response)



# Generate clusters based on current nodes
@app.route('/generateClusters/<info>')
def generateClusters(info):
    info = json.loads(info)
    nodes = info['nodes']
    method = info['method']
    weight = info['weight']

    # record clusters activities
    user = session['user']
    record_wid = sorted(nodes)
    rthread = record_thread(myRtr.userSchema, myRtr.data_version, weight, user, 'generateClusters', [record_wid], ["Omit"], 1)
    rthread.start()

    if method=='normalized':
        k = info['k']
        clusters = myRtr.cutgraph(nodes,k,weight=weight)

    elif method=='mcl':
        r = info['r']
        M, clusters = myRtr.mcl_cluster(nodes,r,weight=weight)
    else:
        raise TypeError('unknown clustering method')

    #sort clusters by centrality
    distance = info['distance']
    clusters = myRtr.sort_clustersCentrality(clusters,distance)
    response = json.dumps(clusters)
    return make_response(response)




# query generator in the server
@app.route('/generator/<info>')
def generator(info):
    info = json.loads(info)
    distance = info['parameters']['parameters']['tp']
    query_type= info['parameters']['generator']
    info['parameters']['user'] =  session['user']
    if info['explorelocal']==True:
        info['localnodes'] = info['parameters']['parameters']['localnodes']

    explorenodes,explorepaths, position= myRtr.my_Gen(**info['parameters'])

    #record user activities
    if info['explorelocal']==False:
        if len(explorepaths)>0:
            record_wids = [path['ids'] for path in explorepaths]
            record_labels = [path['labels'] for path in explorepaths]
            rthread = record_thread(myRtr.userSchema,myRtr.data_version,distance,session['user'],query_type,record_wids,record_labels,position)
            rthread.start()

    if set(explorenodes).issubset(info['localnodes']):
        response = json.dumps({'AddNew':False,'paths':explorepaths,"position":position})
    else:
        localG = myRtr.G.subgraph(set(info['localnodes']) | set(explorenodes))  # local
        allnodes = [{"wid":n, "label":localG.node[n]["label"],"N":localG.degree(n,weight="weight"), "n":localG.degree(n)} for n in localG.nodes()]
        alledges=[{"source":source, "target":target, 'dist':dist} for (source,target,dist) in localG.edges(data=distance)]
        dataset={'AddNew':True,"allnodes":allnodes, "alledges":alledges,"paths":explorepaths,"position":position}
        response=json.dumps(dataset)

    return make_response(response)

# check first time visit
@app.route('/checkFirstTimevisit')
def checkFirstTimevisit():
    if session['firstTimeVisit'] == True:
        session['firstTimeVisit'] =False
        info = True
    else:
        info = False
    response = json.dumps(info)
    return make_response(response)





# get NeighborLevel for a node
@app.route('/neighbor_level/<int:node>')
def neighbor_level(node):
    response=my_localRtr.get_Neib_one(node,None)
    response['disconnected']=set(my_localRtr.G.nodes()).difference(response["AllNb"])
    response.pop("AllNb")
    for key,value in response.iteritems():
        response[key]=list(value)

    response=json.dumps(response)
    return make_response(response)


# WordRank
# Get relevant word list and corresponding path list for a word
@app.route('/wordrank/<int:node>')
def wordrank(node):
    response = my_localRtr.get_Rel_one(node,"Fw", None )
    nodesandpaths=[]
    for n,p in response.iteritems():
        path=p[1]
        nodesandpaths.append([n,path])
    response=json.dumps(nodesandpaths)
    return make_response(response)




############ FEEDBACK DATA COLLECTION #####################
@app.route('/feedback')
def feedback():
    email = session['user']
    return render_template('feedback.html', email=email)

# the first page of feedback completes:
@app.route('/feedback-2', methods = ['POST'])
def BI_data():
    email = request.form['BI1']
    BI2 = request.form['BI2']
    BI3 = request.form['BI3']
    BI4 = request.form['BI4']
    BI5_temp = request.form.getlist('BI5')
    BI5 = json.dumps(BI5_temp)

    answer = [BI2,BI3,BI4,BI5]
    print email, BI2,BI3,BI4,BI5, answer

    cnx, cursor = PF.creatCursor('feedback',"W")
    Qy = 'SELECT MAX(`times_count`) FROM `ans_all` WHERE `email`="{}"'.format(email)
    cursor.execute(Qy)
    times_count_array = cursor.fetchone()
    times_count_last = times_count_array[0]
    if times_count_last is None:
        times_count = 1
    else:
        times_count = times_count_last + 1
    session['feedback_times'] = times_count

    for i in range(1,5):
        Qy = 'INSERT INTO `ans_all` (`times_count`, `email`, `question`, `answer`, `time`) VALUES (\'{}\', \'{}\', \'BI{}\', \'{}\', \'{}\' )'.format(times_count, email, i+1, answer[i-1], time.strftime('%Y-%m-%d %H:%M:%S'))
        cursor.execute(Qy)
    cnx.commit()
    cursor.close()
    cnx.close()

    return make_response(open('feedback-2.html').read())

#the second page of feedback comletes:
@app.route('/feedback-3', methods = ['POST'])
def HCI_data():
    email = session['user']
    HCI1 = request.form['HCI1']
    HCI2 = request.form['HCI2']
    HCI3 = request.form['HCI3']
    HCI3_t = request.form['HCI3-t']
    HCI4 = request.form['HCI4']
    HCI5 = request.form['HCI5']
    submit_count = int(request.form['submit_count'])
    print type(submit_count)
    print 'submit_count: ', submit_count

    if HCI3 == 'yes':
        answer = [HCI1,HCI2,HCI3,HCI4,HCI5]
    elif HCI3 == 'no':
        answer = [HCI1,HCI2,HCI3_t,HCI4,HCI5]
    print 'answer', answer

    cnx, cursor = PF.creatCursor('feedback',"W")
    times_count = session['feedback_times']

    if (submit_count == 1):
        print 'count is 1'
        for i in range(0, 5):
            Qy = 'INSERT INTO `ans_all` (`times_count`, `email`, `question`, `answer`, `time`) VALUES (\'{}\', \'{}\', \'HCI{}\', \'{}\', \'{}\' )'.format(
                times_count, email, i + 1, answer[i], time.strftime('%Y-%m-%d %H:%M:%S'))
            cursor.execute(Qy)
    else:
        print 'count is more than 1'
        for i in range(0, 5):
            Qy = 'INSERT INTO `ans_all` (`times_count`, `email`, `question`) VALUES (\'{}\', \'{}\', \'HCI{}\') ON DUPLICATE KEY UPDATE answer = \'{}\', `time`=\'{}\' '.format(
                times_count, email, i + 1, answer[i], time.strftime('%Y-%m-%d %H:%M:%S'))
            cursor.execute(Qy)

    cnx.commit()
    cursor.close()
    cnx.close()


    ################## get question content

    questions = userQuestion(myRtr.userSchema,email,5)
    if questions.has_key('get_Rel_one'):
        explore = questions['get_Rel_one']
    else:
        explore = None
    if questions.has_key('find_paths'):
        path = questions['find_paths']
    else:
        path = None
    if questions.has_key('find_paths_clusters'):
        cluster = questions['find_paths_clusters']
    else:
        cluster = None

    return render_template('feedback-3.html', explore=explore, path = path, cluster=cluster)

#prepared to submit the feedback:
@app.route('/feedback-submit', methods = ['POST'])
def FE_data():
    email = session['user']
    FE1_11 = request.form['FE1-11']
    FE1_12 = request.form['FE1-12']
    FE1_21 = request.form['FE1-21']
    FE1_22 = request.form['FE1-22']
    FE1_31 = request.form['FE1-31']
    FE1_32 = request.form['FE1-32']
    FE1_array = [FE1_11,FE1_12,FE1_21,FE1_22,FE1_31,FE1_32]
    print FE1_array
    FE1 = json.dumps(FE1_array)

    FE2_1 = request.form['FE2-1']
    FE2_2 = request.form['FE2-2']
    FE2_array = [FE2_1,FE2_2]
    FE2 = json.dumps(FE2_array)

    FE3 = request.form['FE3']
    FE4 = request.form['FE4']
    FE5 = request.form['FE5']
    FE6 = request.form['FE6']

    FE7_temp = request.form['FE7']
    FE7_r_temp = request.form.getlist('FE7-r')
    if (FE7_temp == 'yes'):
        FE7 = json.dumps(FE7_temp)
    else:
        FE7 = json.dumps(FE7_r_temp)

    FE8 = request.form['FE8']

    answer = [FE1, FE2, FE3, FE4, FE5, FE6, FE7, FE8]

    print FE1, FE2, FE3, FE4, FE5, FE6, FE7, FE8,  answer

    cnx, cursor = PF.creatCursor('feedback', "W")
    times_count = session['feedback_times']

    for i in range(0, 8):
        Qy = 'INSERT INTO `ans_all` (`times_count`, `email`, `question`, `answer`, `time`) VALUES (\'{}\', \'{}\', \'FE{}\', \'{}\', \'{}\' ) ON DUPLICATE KEY UPDATE answer = \'{}\', `time`=\'{}\' '.format(
            times_count, email, i + 1, answer[i], time.strftime('%Y-%m-%d %H:%M:%S'), answer[i], time.strftime('%Y-%m-%d %H:%M:%S'))
        cursor.execute(Qy)
    cnx.commit()
    cursor.close()
    cnx.close()

    return make_response(open('fb-completion.html').read())

if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True, port=5000)
