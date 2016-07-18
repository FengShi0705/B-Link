import PubFunctions
import networkx as nx
from time import time

def test_ReadNeighborsFromMysql():
    cnx,rcursor=PubFunctions.creatCursor('abcdeijm_test','R')

    sG1=nx.Graph()
    t1s=time()
    PubFunctions.DFS_recursive_LevelNeighbor(500,sG1,rcursor,'all_w2w',maxlevel=1)
    t1e=time()


    sG2=nx.Graph()
    t2s=time()
    PubFunctions.BFS_LevelNeighbor(500,sG2,rcursor,'all_w2w',maxlevel=1)
    t2e=time()


    sG3=nx.Graph()
    t3s=time()
    PubFunctions.Complex_DFS_LevelNeighbor(500,sG3,rcursor,'all_w2w',1)
    t3e=time()


    print len(sG1.edges()),len(sG1.nodes()),t1e-t1s

    print len(sG2.edges()),len(sG2.nodes()),t2e-t2s

    print len(sG3.edges()),len(sG3.nodes()),t3e-t3s

    return


def test_allweight():

    G=nx.Graph()
    G.add_edges_from([(1,2,{'weight':1.0}),(1,3,{'weight':3.0}),(3,2,{'weight':2.0}),(3,4,{'weight':4.0})])

    return


