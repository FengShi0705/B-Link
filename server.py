from flask import Flask, render_template, make_response, request,session,redirect
import json
import networkx as nx
from networkanalysis.Analysis import Retrievor
from user_Feedback.recordUser import record_thread,error_thread
from time import gmtime, strftime

app = Flask(__name__)
app.secret_key='\x8b\x19\xa1\xb0D\x87?\xc1M\x04\xff\xc8\xbdE\xb1\xca\xe6\x9e\x8d\xb3+\xbe>\xd2'

# Initial Data
# whole retrievor, use whole database as its own graph
<<<<<<< HEAD
myRtr=Retrievor.UndirectedG('undirected(fortest)','fortest','userdata')

# sign up
@app.route('/signup/<info>')
def signup(info):
    info = json.loads(info)
    user = info['user']
    w = info['w']
    #user = request.args.get('email','')
=======
myRtr=Retrievor.UndirectedG('undirected(fortest)','abcdeijm_test','userdata')

# sign up
@app.route('/signup')
def signup():
    user = request.args.get('email','')
    w = request.args.get('w','')
>>>>>>> refs/remotes/FengShi0705/new-features
    session['user'] = user
    fusers = open('allusers.txt', mode='a')
    fusers.write(user+'\n')
    fusers.close()
    return redirect('/?w={}'.format(w))


# Main Page
@app.route('/')
def index():
    w = request.args.get('w','')
    if 'user' in session:
        w = request.args.get('w','')
        print session['user']
<<<<<<< HEAD
        if w<=750:
            return make_response(open('m-index.html').read())
=======
        if int(w)<=750:
            print 'moble'
>>>>>>> refs/remotes/FengShi0705/new-features
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
    distance = info['tp']
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
    localG = myRtr.G.subgraph(set(info['currentnodes']+[info['query']]))
    allnodes = [
        {"wid": n, "label": localG.node[n]["label"], "N": localG.degree(n, weight="weight"), "n": localG.degree(n)} for
        n in localG.nodes()]
    alledges = [{"source": source, "target": target, distance: dist} for (source, target, dist) in localG.edges(data=distance)]
    sorted_paths = sorted(localG.edges(nbunch=[info['query']],data=distance), key=lambda x:x[2])
    add_paths = [path[:-1] for path in sorted_paths]
    try:
        bornnode = sorted_paths[0][1]
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
    rthread = record_thread(myRtr.userSchema, myRtr.data_version, info['distance'], user, 'generateClusters', [record_wid], ["Omit"], 1)
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
        alledges=[{"source":source, "target":target, distance:dist} for (source,target,dist) in localG.edges(data=distance)]
        dataset={'AddNew':True,"allnodes":allnodes, "alledges":alledges,"paths":explorepaths,"position":position}
        response=json.dumps(dataset)

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


if __name__ == '__main__':
    app.run(host='0.0.0.0', threaded=True, port=5000)
