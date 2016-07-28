# this module is for the existing relevant information retrieval.
import networkx as nx
from FengPrivate import PF
import collections



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












