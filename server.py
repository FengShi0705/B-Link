from flask import Flask, render_template, make_response, request,session,redirect
import json
import networkx as nx
from networkanalysis.Analysis import Retrievor
from time import gmtime, strftime

app = Flask(__name__)
app.secret_key='\x8b\x19\xa1\xb0D\x87?\xc1M\x04\xff\xc8\xbdE\xb1\xca\xe6\x9e\x8d\xb3+\xbe>\xd2'

# Initial Data
# whole retrievor, use whole database as its own graph
myRtr=Retrievor.UndirectedG(nx.read_gpickle('data/undirected(fortest).gpickle'),'fortest')

# sign up
@app.route('/signup')
def signup():
    user = request.args.get('email','')
    session['user'] = user
    fusers = open('allusers.txt', mode='a')
    fusers.write(user+'\n')
    fusers.close()
    return redirect('/')


# Main Page
@app.route('/')
def index():
    if 'user' in session:
        print session['user']
        return make_response(open('index.html').read())
    else:
        return make_response(open('signup.html').read())


# get text return nodes number
@app.route('/texttowid/<searchtext>')
def texttowid(searchtext):
    searchtext = searchtext.encode('utf-8')
    ipts = [word.strip() for word in searchtext.split(';')]
    wids=myRtr.input_ids(ipts)
    response=json.dumps(wids[0])
    return make_response(response)

# search button, add one node
@app.route('/searchbutton/<info>')
def search(info):
    info = json.loads(info)
    localG = myRtr.G.subgraph(set(info['currentnodes']+[info['query']]))
    allnodes = [
        {"wid": n, "label": localG.node[n]["label"], "N": localG.degree(n, weight="weight"), "n": localG.degree(n)} for
        n in localG.nodes()]
    alledges = [{"source": source, "target": target, "Fw": Fw} for (source, target, Fw) in localG.edges(data="Fw")]
    sorted_paths = sorted(localG.edges(nbunch=[info['query']],data='Fw'), key=lambda x:x[2])
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








# query generator in the server
@app.route('/generator/<info>')
def generator(info):
    info=json.loads(info)
    info['parameters']['user'] =  session['user']
    if info['explorelocal']==True:
        info['localnodes'] = info['parameters']['parameters']['localnodes']

    explorenodes,explorepaths = myRtr.my_Gen(**info['parameters'])

    if set(explorenodes).issubset(info['localnodes']):
        response = json.dumps({'AddNew':False,'paths':explorepaths})
    else:
        localG = myRtr.G.subgraph(set(info['localnodes']) | set(explorenodes))  # local
        allnodes = [{"wid":n, "label":localG.node[n]["label"],"N":localG.degree(n,weight="weight"), "n":localG.degree(n)} for n in localG.nodes()]
        alledges=[{"source":source, "target":target, "Fw":Fw} for (source,target,Fw) in localG.edges(data="Fw")]
        dataset={'AddNew':True,"allnodes":allnodes, "alledges":alledges,"paths":explorepaths}
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

app.run(threaded=True)
