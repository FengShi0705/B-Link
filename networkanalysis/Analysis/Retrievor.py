# this module is for the existing relevant information retrieval.
import networkx as nx
from FengPrivate import PF
import collections
from sklearn.utils.graph import graph_laplacian
from sklearn.utils.arpack import eigsh
import numpy as np
import math
from sklearn.cluster.k_means_ import k_means



class UndirectedG(object):
    # Read Graph, define schema
    def __init__(self,G,schema):
        self.G=G
        print "----Read graph"
        self.schema=schema
        assert type(self.G)==nx.classes.graph.Graph, 'Not undirected graph'
        self.cnx, self.cursor = PF.creatCursor(self.schema, 'R')
        print "----Connect mysql"




    # return ids list of input words
    # Inputs is a list of words
    def input_ids(self,ipts):

        ipwids=PF.find_id(ipts,self.cursor)
        ipwids=list(set(ipwids))
        for n in ipwids:
            print n, self.G.node[n]['label']
        return ipwids




    # Use shortest path algorithms to get neighbors for one input
    # Get all the neighbors within l level
    # Get the neighbors of each level whihin l level
    # retured type is node
    # OK checked
    def get_Neib_one(self,ipt,l):
        nei=nx.single_source_shortest_path_length(self.G,ipt,cutoff=l)
        NB={}
        for key,value in nei.iteritems():
            NB.setdefault(value,set()).add(key)
            NB.setdefault('AllNb',set()).add(key)

        return NB


    # Use shortest path algorithm to get neighbors
    # get neighbors of each input within l level
    # get neighbors of each level for each input
    # get unioned neighbors of all inputs within l level
    # returned type is node
    # OK checked
    def get_Neib(self,l,ipts):
        NB_Eachipt={}
        NB_Allipts=set()
        for ipt in ipts:
            NB_Eachipt[ipt]=self.get_Neib_one(ipt,l)
            NB_Allipts.update(NB_Eachipt[ipt]['AllNb'])

        return {"NB_Eachipt":NB_Eachipt,"NB_Allipts":NB_Allipts}




    # Top N-1 words for one input, totally N words
    # Based on probable path / relativeness measurement
    # Rel Form is OrderedDict(  [    ( target, [ length, [path from source to target] ] ) ,...] )
    # Checked OK
    def get_Rel_one(self,ipt,tp,N):
        T2L,T2P=nx.single_source_dijkstra(self.G,ipt,Noff=N,weight=tp)

        sorted_T=sorted(T2L.keys(),key=T2L.get)
        Rel=[]
        for t in sorted_T:
            Rel.append((t,[T2L[t],T2P[t]]))
        Rel=collections.OrderedDict(Rel)

        return Rel




    # get top N-1 words for each input
    # Based on probable path / relativeness measurement
    # RL_Eachipt Form is {ipt: OrderedDict }
    # RL_Allipts is all the union of N words for each input.
    # Checked OK
    def get_Rel(self,tp,N,ipts):
        RL_Eachipt={}
        RL_Allipts=set()

        for ipt in ipts:
            RL_Eachipt[ipt]=self.get_Rel_one(ipt,tp,N)
            RL_Allipts.update(RL_Eachipt[ipt].keys())

        return {"RL_Eachipt":RL_Eachipt,"RL_Allipts":RL_Allipts}



    def cut_connectedgraph(self,nodes,k,algorithm='normalized'):
        """
        applying clustering on the subgraph consisting of the input nodes

        Paramters
        ----------
        nodes: a list of node to be clustered. The subgraph projected by the nodes should be connected.

        k: the number of clusters to be generated

        algorithm: {'normalized', 'modularity'}, default to 'normalized'

        Return
        ----------
        clusters: array of lists. Each list contains the nodes of a cluster
        """
        G = self.G.subgraph(nodes)
        assert nx.is_connected(G)==True, "graph is not connected"
        A = nx.adjacency_matrix(G, weight='weight')

        if algorithm=="normalized":
            Ls, dd = graph_laplacian(A, normed=True, return_diag=True)
            eigenvalue_n, eigenvector_n = eigsh(Ls * (-1), k=k,
                                                sigma=1.0, which='LM',
                                                tol=0.0)
            n_nodes=len(nodes)
            eigenvector_n[:,-1] = np.full( n_nodes , 1.0/math.sqrt(n_nodes) ) # eigenvector for eigenvalue zero


        elif algorithm=="modularity":
            tr = np.sum(A)
            d = np.sum(A,axis=1)
            Q = ( A - (d*d.T)/tr ) /tr
            eigenvalue_n, eigenvector_n = eigsh(Q, k=k,
                                                sigma=1.0, which='LM',
                                                tol=0.0)
            for i,vl in enumerate(eigenvalue_n):
                if vl > 1e-10:
                    eigenvector_n = eigenvector_n[:,i:]
                    break

        else:
            raise TypeError, "unrecognized algorithm: {}".format(algorithm)

        # normalize row vector
        for i, v in enumerate(eigenvector_n):
            eigenvector_n[i] = v / float(np.linalg.norm(v))

        _, labels, _ = k_means(eigenvector_n, k, random_state=None,
                               n_init=10)

        dic_clusters={}
        for index,n in enumerate(G.nodes()):
            dic_clusters.setdefault(labels[index],list()).append(n)

        clusters=dic_clusters.values()

        return clusters


















