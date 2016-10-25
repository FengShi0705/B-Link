import networkx as nx
import time
import main

def test_ReadNeighborsFromMysql():
    cnx,rcursor=PubFunctions.creatCursor('abcdeijm_test','R')

    sG1=nx.Graph()
    t1s=time.time()
    PubFunctions.DFS_recursive_LevelNeighbor(500,sG1,rcursor,'all_w2w',maxlevel=1)
    t1e=time.time()


    sG2=nx.Graph()
    t2s=time.time()
    PubFunctions.BFS_LevelNeighbor(500,sG2,rcursor,'all_w2w',maxlevel=1)
    t2e=time.time()


    sG3=nx.Graph()
    t3s=time.time()
    PubFunctions.Complex_DFS_LevelNeighbor(500,sG3,rcursor,'all_w2w',1)
    t3e=time.time()


    print len(sG1.edges()),len(sG1.nodes()),t1e-t1s

    print len(sG2.edges()),len(sG2.nodes()),t2e-t2s

    print len(sG3.edges()),len(sG3.nodes()),t3e-t3s

    return


def test_allweight():

    G=nx.Graph()
    G.add_edges_from([(1,2,{'weight':1.0}),(1,3,{'weight':3.0}),(3,2,{'weight':2.0}),(3,4,{'weight':4.0})])

    return


def rawGraph_withAlpha():
    """
    load raw data and add disparity alpha value
    :return:
    """
    schema = 'total_v3_csvneo4j'
    reltable = 'all_w2w'
    labtable = 'all_keywords'
    Graph_type = 'undirected'

    G = main.load_rawGraph(schema,reltable,labtable,Graph_type=Graph_type)
    G = main.disparity_alpha(G)
    nx.write_gpickle(G, '../RawGraphWithDisparityAlpha_{}_{}.gpickle'.format(Graph_type,schema))
    return


def filter_edgeandNode():
    """
    filter edge based on disparity alpha.
    filter node based on node degree
    :return:
    """
    rawGraph_withAlpha()
    time.sleep(60)

    schema = 'total_v3_csvneo4j'
    Graph_type = 'undirected'
    alpha_thred =0.5
    nodeDegree_thred = 1.0


    while alpha_thred<1.0:
        G = nx.read_gpickle('../RawGraphWithDisparityAlpha_{}_{}.gpickle'.format(Graph_type,schema))
        G = main.disparity_filter(G,alpha_thred)
        G = main.nodeDegree_filter(G,nodeDegree_thred)
        nx.write_gpickle(G,'filteredG_{}_alpha{}_nodeD{}_{}'.format(Graph_type,alpha_thred,nodeDegree_thred,schema))
        print '-----',alpha_thred,'----------'
        alpha_thred += 0.05
    return



