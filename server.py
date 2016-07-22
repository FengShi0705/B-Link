from flask import Flask, render_template, make_response, request
import json
import networkx as nx
from networkanalysis.Analysis import Retrievor,PF
from time import gmtime, strftime

app=Flask(__name__)

# Initial Data
# whole retrievor, use whole database as its own graph
myRtr=Retrievor.UndirectedG(nx.read_gpickle('data/undirected(fortest).gpickle'),'fortest')
# local retrievor, use search result as its own graph
my_localRtr=Retrievor.UndirectedG(nx.Graph(),'fortest')

# return local graph of input text
def get_localgraph(text):
    ipts=[word.strip() for word in text.split(';')]
    myRtr.input_ids(ipts)
    print "finish got input from mysql",strftime("%Y-%m-%d %H:%M:%S", gmtime())
    myRtr.get_Rel('Fw',100)
    print "finish got top 100 relevant words and corresonding paths for each inputs",strftime("%Y-%m-%d %H:%M:%S", gmtime())
    my_localRtr.G = myRtr.G.subgraph(myRtr.RL_Allipts) # local
    print "finish got local graph",strftime("%Y-%m-%d %H:%M:%S", gmtime())

    return my_localRtr.G

# Main Page
@app.route('/')
def index():
    return make_response(open('index.html').read())


# get text return nodes number
@app.route('/texttowid/<searchtext>')
def texttowid(searchtext):
    ...

# Produce data of the localgraph for the search text
@app.route('/gdata/<searchtext>')
def gdata(searchtext):
    searchtext=searchtext.encode('utf-8')
    localgraph=get_localgraph(searchtext)
    nodes=[{"wid":n, "label":localgraph.node[n]["label"],"N":localgraph.degree(n,weight="weight"), "n":localgraph.degree(n)} for n in localgraph.nodes()]
    edges=[{"source":source, "target":target, "Fw":Fw} for (source,target,Fw) in localgraph.edges(data="Fw")]

    dataset={"nodes":nodes, "edges":edges}
    print "finish prepare dataset",strftime("%Y-%m-%d %H:%M:%S", gmtime())
    datajson=json.dumps(dataset)
    print "send data to client",strftime("%Y-%m-%d %H:%M:%S", gmtime())
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


