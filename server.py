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
    response=json.dumps(wids)
    return make_response(response)


# receive queries, nodes currently existing in client, and N (the number of nodes to be explored around each queries)
# explore around queries for most N relevent words
# return all nodes to the client, and all edges for client graph, and queries
@app.route('/explore/<info>')
def explore(info):
    info=json.loads(info)
    existing_nodes=info["existing_nodes"]
    queries=info["queries"]
    N=info["N"]
    explorenodes=myRtr.get_Rel(info['tp'],info['N'],info['ipts'],info['user'],)

    localG = myRtr.G.subgraph(set(existing_nodes)|set(explorenodes))  # local
    allnodes=[{"wid":n, "label":localG.node[n]["label"],"N":localG.degree(n,weight="weight"), "n":localG.degree(n)} for n in localG.nodes()]
    alledges=[{"source":source, "target":target, "Fw":Fw} for (source,target,Fw) in localG.edges(data="Fw")]

    dataset={"allnodes":allnodes, "alledges":alledges,"queries":queries}
    datajson=json.dumps(dataset)
    return make_response(datajson)

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

app.run(host="0.0.0.0",threaded=True)
