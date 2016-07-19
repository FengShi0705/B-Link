from flask import Flask, render_template, make_response, request
import json
import networkx as nx
from networkanalysis.Analysis import Retrievor,PF

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
    myRtr.get_Rel('Fw',100)
    my_localRtr.G = myRtr.G.subgraph(myRtr.RL_Allipts) # local

    return my_localRtr.G

# Main Page
@app.route('/')
def index():
    return make_response(open('index.html').read())

# Produce data of the localgraph for the search text
@app.route('/gdata/<searchtext>')
def gdata(searchtext):
    searchtext=searchtext.encode('utf-8')
    localgraph=get_localgraph(searchtext)
    nodes=[{"wid":n, "label":localgraph.node[n]["label"],"N":localgraph.degree(n,weight="weight"), "n":localgraph.degree(n)} for n in localgraph.nodes()]
    edges=[{"source":source, "target":target, "Fw":Fw} for (source,target,Fw) in localgraph.edges(data="Fw")]

    dataset={"nodes":nodes, "edges":edges}
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
    response = my_localRtr.get_Rel_one(node,"Fw", len(nx.node_connected_component(my_localRtr.G, node)) )
    nodesandpaths=[]
    for n,p in response.iteritems():
        path=p[1]
        nodesandpaths.append([n,path])
    response=json.dumps(nodesandpaths)
    return make_response(response)


