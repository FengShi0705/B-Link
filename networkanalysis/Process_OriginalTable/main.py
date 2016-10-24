from Private.PubFunctions import unweight_allocation
from Private import PubFunctions
import networkx as nx
import datetime
import math
import time


def write_undirected(schema,reltable,labtable):
    uG=PubFunctions.loadw2wdict(schema,reltable,'undirected')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': undirected graph readed'

    uG=PubFunctions.uG_to_uGuW(uG,'undirected')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': undirected graph add weights'

    uG=PubFunctions.load_nodelabel(uG,schema,labtable)
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': undirected graph add node label'

    nx.write_gpickle(uG,'undirected.gpickle')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': undirected graph written'

    return

def write_onedirected(schema,reltable,labtable,tp):
    dG=PubFunctions.loadw2wdict(schema,reltable,'one-directed')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': one-directed graph readed'

    dG=PubFunctions.dG_to_dGuW(dG,tp,'one-directed')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': one-directed graph add weights'

    dG=PubFunctions.load_nodelabel(dG,schema,labtable)
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': one-directed graph add node label'

    nx.write_gpickle(dG,'onedirected_{}.gpickle'.format(tp))
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': one-directed graph written'

    return

def write_bidirected(schema,reltable,labtable,tp):
    bdG=PubFunctions.loadw2wdict(schema,reltable,'bi-directed')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': bi-directed graph readed'

    bdG=PubFunctions.bdG_to_bdGdW(bdG,tp,'bi-directed')
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': bi-directed graph add weights'

    bdG=PubFunctions.load_nodelabel(bdG,schema,labtable)
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': bi-directed graph add node label'

    nx.write_gpickle(bdG,'bidirected_{}.gpickle'.format(tp))
    print datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S'),': bi-directed graph written'

    return


# The main function use original keywords table and relations table of a schema.
# And create three forms of graph:
# 1. undirected graph with undirected weights and domian dissimilarity
# 2. one-directed graph with undirected weights, domian dissimilarity, and G2S direction
# 3. bi-directed graph with forwards and backwards directed weights
# Finally, write these three graphs into gpickle
#Checked OK
def main(schema,reltable,labtable,tp):

    write_undirected(schema,reltable,labtable)
    write_onedirected(schema,reltable,labtable,tp)
    write_bidirected(schema,reltable,labtable,tp)

    print 'All finished'

    return


def reduceGraph(read_g, write_g, minEdgeWeight, minNodeDegree, Lp, Sp):
    """
    Simplify the undirected graph and then update the 3 undirected weight properties.
    :param read_g: is the graph pickle to read
    :param write_g: is the updated graph pickle to write
    :param minEdgeWeight: the original weight of each edge should be >= minEdgeWeight
    :param minNodeDegree: the degree of each node should be >= minNodeDegree. the degree here is G.degree(node), NOT G.degree(node,weight='weight)
    :return: None
    """
    G=nx.read_gpickle(read_g)
    print 'number of original nodes: ', nx.number_of_nodes(G)
    print 'number of original edges: ', nx.number_of_edges(G)

    for (u,v,w) in G.edges(data='weight'):
        if w < minEdgeWeight:
            G.remove_edge(u,v)

    for n in G.nodes():
        if G.degree(n)<minNodeDegree:
            G.remove_node(n)

    print 'number of new nodes: ', nx.number_of_nodes(G)
    print 'number of new edges: ', nx.number_of_edges(G)

    for (a, b, w) in G.edges_iter(data='weight'):
        unweight_allocation(G, a, b, w,Lp,Sp)

    print 'update weight ok'
    nx.write_gpickle(G, write_g)

    return




def disparity_graph(schema,reltable,labtable,alpha_thred,nodeDegree_thred,Graph_type='undirected'):
    """
    Network reduction by disparity filter algorithm.
    ALso update the relationship direction as 'general --> specifi' if the graph is directed.
    Finally, write the gpickle
    :param schema: the mysql schema storing the data
    :param reltable: the name of edge table
    :param labtable: the name of keywords lable table
    :param alpha_thred: the threshold of alpha for disparity filter algorithm
    :param nodeDegree_thred: the threshold of minimum node degree
    :param Graph_type: the graph type: 'undirected' or 'one-directed'
    :return: none, write the gpickle
    """
    def get_maxAlpha(G,i,j,w):
        Si = G.degree(i,weight='weight')
        Pij = w/Si
        Ki = float(G.degree(i))
        if Ki>1:
            alpha_i = 1.0 - math.pow( (1.0 - Pij) , (Ki-1) )
        else:
            alpha_i = 1.0

        Sj = G.degree(j,weight='weight')
        Pji = w/Sj
        Kj = float(G.degree(j))
        if Kj>1:
            alpha_j = 1.0 - math.pow( (1.0 - Pji) ,( Kj-1 ) )
        else:
            alpha_j = 1.0

        return  max(alpha_i,alpha_j)


    #load graph by edge table
    G = PubFunctions.loadw2wdict(schema, reltable, Graph_type)
    print 'finish loading raw data',time.strftime('%Y-%m-%d %H:%M:%S')
    print 'edges: ', len(G.edges())
    print 'nodes: ', len(G.nodes()),'\n'


    # calculate alpha
    for (a, b, w) in G.edges(data='weight'):
        alpha = get_maxAlpha(G,a,b,w)
        G[a][b]['maxAlpha'] = alpha
    print 'finish calculate alpha',time.strftime('%Y-%m-%d %H:%M:%S')
    print 'edges: ', len(G.edges())
    print 'nodes: ', len(G.nodes()),'\n'

    # disparity_filter
    for (a,b) in G.edges():
        if G[a][b]['maxAlpha'] < alpha_thred:
            G.remove_edge(a, b)
    print 'finish filter',time.strftime('%Y-%m-%d %H:%M:%S')
    print 'edges: ', len(G.edges())
    print 'nodes: ', len(G.nodes()),'\n'

    # update direction General-->Specific
    if Graph_type == 'one-directed':
        for (a, b) in G.edges():
            if G.degree(a,weight='weight') < G.degree(b,weight='weight'):
                G.add_edge(b, a, G[a][b])
                G.remove_edge(a, b)
        print 'finish update direction',time.strftime('%Y-%m-%d %H:%M:%S')
        print 'edges: ', len(G.edges())
        print 'nodes: ', len(G.nodes()),'\n'
    else:
        assert Graph_type=='undirected', 'unknown graph type: {}'.format(Graph_type)

    #add node label
    G = PubFunctions.load_nodelabel(G, schema, labtable)
    print 'add node label',time.strftime('%Y-%m-%d %H:%M:%S')
    print 'edges: ', len(G.edges())
    print 'nodes: ', len(G.nodes()),'\n'

    #remove node based on node degree threshold
    for n in G.nodes():
        if G.degree(n) < nodeDegree_thred:
            G.remove_node(n)
    print 'finish remove node: ',time.strftime('%Y-%m-%d %H:%M:%S')
    print 'edges: ', len(G.edges())
    print 'nodes: ', len(G.nodes()),'\n'

    nx.write_gpickle(G, '../DispReduced_{}_{}_alpha{}.gpickle'.format(schema,Graph_type,alpha_thred))

    return


