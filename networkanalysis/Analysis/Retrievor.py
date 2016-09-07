# this module is for the existing relevant information retrieval.
import networkx as nx
from Private import PF
import collections
from sklearn.utils.graph import graph_laplacian
from sklearn.utils.arpack import eigsh
import numpy as np
import math
from sklearn.cluster.k_means_ import k_means
import itertools
from heapq import heappush, heappop



class UndirectedG(object):
    # Read Graph, define schema
    def __init__(self,G,schema):
        self.G=G
        print "----Read graph"
        self.schema=schema
        assert type(self.G)==nx.classes.graph.Graph, 'Not undirected graph'
        self.cnx, self.cursor = PF.creatCursor(self.schema, 'R')
        print "----Connect mysql"
        self.user_generators={}
        self.gencode={'get_Rel_one':self.get_Rel_one}




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





    def get_Rel_one(self,ipt,tp,minhops,localnodes=None):
        """
        Generator of the most relevant words and their corresponding paths for an input.
        The word is sorted by the distance of its shortest path from input, and is filtered by minhops of its shortest path.
        The corresponding path of the word is its shortest path.

        :param ipt: source
        :param tp: the property of edge to be used as distance
        :param minhops: the minimum hops that the word's shortest path should contain
        :param localnodes: if none, find the relevent words in whole graph. Else, find the relevant words in localgraph.
        :return: (length, word's shortest path)
        """
        if localnodes==None:
            G = self.G
        else:
            G = self.G.subgraph(localnodes)

        push = heappush
        pop = heappop
        dist = {}  # dictionary of final distances
        seen = {ipt: 0}
        c = itertools.count()
        fringe = []  # use heapq with (distance,label) tuples
        push(fringe, (0, next(c), ipt))
        paths={ipt:[ipt]}
        while fringe:
            (d,_,v)=pop(fringe)
            if v in dist:
                continue # already searched this node

            dist[v]=d
            if len(paths[v])>=minhops+1:
                yield (d, paths[v])

            for u in G.adj[v].keys():
                cost = G[u][v][tp]
                if cost is None:
                    continue
                vu_dist = dist[v] + cost
                if u in dist:
                    if vu_dist < dist[u]:
                        raise ValueError('Contradictory paths found:',
                                         'negative weights?')
                elif u not in seen or vu_dist < seen[u]:
                    seen[u] = vu_dist
                    push(fringe, (vu_dist, next(c), u))
                    paths[u] = paths[v] + [u]



    def get_pathsBetween_twonodes(self,source,target,tp,minhops,localnodes=None):

        if localnodes == None:
            G = self.G
        else:
            G = self.G.subgraph(localnodes)

        dist = [{},{}] #dictionary of paths from start(and end) to middle nodes keyed by middle nodes
        fringe = [[],[]] #heap of (distance, path) tuples for extracting next node to expand

        wholeQ=[]
        push = heappush
        pop = heappop

        push(fringe[0],(0,[source]))

        push(fringe[1],(0,[target]))

        while fringe[0] or wholeQ:
            if wholeQ:
                (outd,outp) = pop(wholeQ)
                if len(outp) >= minhops+1:
                    yield (outd,outp)

            if fringe[0]:
                #forward
                (d,p)= pop(fringe[0])

                end = p[-1]
                if end in dist[1]:
                    end_Bs=set()
                    for (re_d, re_p) in dist[1][end]:
                        if len(re_p)>1:
                            end_Bs.add(re_p[-2])
                        if len(set(p)&set(re_p))==1:
                            re_p = re_p[::-1]
                            bi_d = d + re_d
                            bi_p = p + re_p[1:]
                            push(wholeQ, (bi_d, bi_p))
                    if end!=target: #continue explore
                        for nei in G.adj[end].keys():
                            if nei not in p and nei not in end_Bs:
                                up_d = d + G[nei][end][tp]
                                up_p = p + [nei]
                                push(fringe[0], (up_d, up_p))
                else:
                    dist[0].setdefault(end, list()).append((d, p))
                    for nei in G.adj[end].keys():
                        if nei not in p:
                            up_d = d + G[nei][end][tp]
                            up_p = p + [nei]
                            push(fringe[0], (up_d, up_p))



                #backward
                if fringe[1]:
                    (d, p) = pop(fringe[1])
                    end=p[-1]


                    if end in dist[0]:
                        continue
                    else:
                        dist[1].setdefault(end, list()).append((d, p))
                        for nei in G.adj[end].keys():
                            if nei not in p:
                                up_d = d + G[nei][end][tp]
                                up_p = p + [nei]
                                push(fringe[1], (up_d, up_p))

        raise ValueError('no more such paths between %s and %s.' %(source,target))




    def my_Gen(self,N,user,parameters,generator,start=True):
        """
        Transform a generator to a function can go forward and backward

        :param N: Number of words/paths to be retrieved. If N is positive, Next N words. If N is negetive, previous N words.
        :param user: user's email
        :param parameters: parameters for the generator
        :param generator: the function of the generator
        :param start: If true, find the first N words/paths. Otherwise, find the next or previous N words/paths
        :return: nodes, paths. nodes is the union set of all nodes in the paths.
        """

        results={}
        generator=self.gencode[generator]

        if start==True:
            self.user_generators[user] = {}
            self.user_generators[user]['generator'] = generator(**parameters)
            self.user_generators[user]['records'] = []
            self.user_generators[user]['position'] = 0
            self.user_generators[user]['max'] = None

        if self.user_generators[user]['position'] + N < 0:
            raise ValueError("position should not be negative")
        else:
            startposition = self.user_generators[user]['position']
            self.user_generators[user]['position'] += N

        n_records = len(self.user_generators[user]['records'])

        if self.user_generators[user]['position'] >= n_records:
            for i in xrange(self.user_generators[user]['position'] - n_records +1):
                try:
                    length, path = self.user_generators[user]['generator'].next()
                except:
                    self.user_generators[user]['max'] = len(self.user_generators[user]['records'])
                    break
                else:
                    self.user_generators[user]['records'].append(path)

        if self.user_generators[user]['max'] is not None and self.user_generators[user]['position']>=self.user_generators[user]['max']:
            self.user_generators[user]['position'] -= N
        elif self.user_generators[user]['position']==0:
            self.user_generators[user]['position'] -= N

        results['allpaths'] = self.user_generators[user]['records'][min(startposition,startposition+N):max(startposition,startposition+N)]
        results['allnodes'] = set()
        finalpaths = []
        for path in results['allpaths']:
            results['allnodes'].update(path)
            lapath = [self.G.node[n]['label'] for n in path]
            finalpaths.append({'ids':path,'labels':lapath})

        return results['allnodes'],finalpaths,min(startposition,startposition+N)+1























    def cut_connectedgraph(self,nodes,k,weight='weight',algorithm='normalized'):
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
        A = nx.adjacency_matrix(G, weight=weight)

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

    def mcl_cluster(self,nodes,r,weight='weight'):
        """
        Applying Markov clustering on the input nodes

        :param nodes: a list of node to be clustered.

        :param r: inflation factor

        :return M: the convergent matrix

        :return clusters: array of lists. Each list contains the nodes of a cluster
        """
        def normalize_matrix(adjacency):
            Tri = adjacency.sum(axis=1)
            M=adjacency/Tri
            return M
        def get_cluster(mx,nodes):
            queue=set(nodes)
            diag=np.array(mx).diagonal()
            clusters={}
            for i,d in enumerate(diag):
                if d>=1e-5:
                    if nodes[i] in queue:
                        queue.remove(nodes[i])
                        clusters.setdefault(nodes[i], set()).add(nodes[i])
                        for j,jd in enumerate(np.array(mx)[:,i]):
                            if jd >= 1e-5 and j!=i:
                                clusters[nodes[i]].add(nodes[j])
                                queue.remove(nodes[j])
                    else:
                        continue

            if len(queue)!=0:
                raise TypeError, "mcl_cluster miss nodes"
            for s1,s2 in itertools.combinations(clusters.keys(),2):
                if clusters[s1] & clusters[s2]:
                    raise TypeError, "mcl_cluster overlapping cluster"

            clusters=[list(cl) for cl in clusters.values()]
            return  clusters


        G=self.G.subgraph(nodes)
        A = nx.adjacency_matrix(G, weight=weight).todense()
        np.fill_diagonal(A, np.sum(A, axis=1) + 1.0)
        M=normalize_matrix(A)

        while True:
            nM=np.linalg.matrix_power(M,2)
            nM=np.power(nM,r)
            nM=normalize_matrix(nM)
            er = np.linalg.norm(nM-M)
            M=nM
            if er<=1e-5:
                break

        clusters=get_cluster(M,G.nodes())

        return M,clusters



    def generate_Bpaths(self,cluster1,cluster2,tp):
        """
        Generator of B-paths between cluster1 and cluster2, ordered by length from shortest to longest

        :param cluster1: list of nodes in cluster1

        :param cluster2: list of nodes in cluster2

        :param tp: the property of edge to be considered as distance

        :return: generate (length,B-path)
        """
        cset1 = set(cluster1)
        cset2 = set(cluster2)
        push = heappush
        pop = heappop

        fringe = [] #queue to sort the B-paths

        for n in cluster1:
            push(fringe, (0, [n]))

        while fringe:
            (d, p) = pop(fringe)
            end = p[-1]

            if end in cset2:  # reach cluster2
                yield (d, p)
                continue

            for nei in self.G.adj[end].keys(): # search near end node
                if nei not in cset1 and nei not in p:
                    up_d = d + self.G[nei][end][tp]
                    up_p = p + [nei]
                    push(fringe, (up_d, up_p))

    def get_pathsBetween_twoClusters(self, cluster1, cluster2, tp, localnodes=None):

        if localnodes == None:
            G = self.G
        else:
            G = self.G.subgraph(localnodes)

        dist = [{}, {}]  # dictionary of paths from cluster to nodes keyed by nodes
        fringe = [[], []]  # heap of (distance, path) tuples for extracting next node to expand
        wholeQ = []
        push = heappush
        pop = heappop

        cset1=set(cluster1)
        cset2=set(cluster2)
        for node1 in cset1:
            push(fringe[0], (0, [node1]))
            dist[0][node1]=[(0, [node1])]
        for node2 in cset2:
            push(fringe[1], (0, [node2]))
            dist[1][node2]=[(0, [node2])]

        while fringe[0] or wholeQ:
            if wholeQ:
                yield pop(wholeQ)

            if fringe[0]:
                # forward
                (d, p) = pop(fringe[0])

                end = p[-1]
                if end in dist[1]:
                    for (re_d, re_p) in dist[1][end]:
                        re_p = re_p[::-1]
                        bi_d = d + re_d
                        bi_p = p + re_p[1:]
                        push(wholeQ, (bi_d, bi_p))
                    if end not in cset2:
                        for nei in G.adj[end].keys():
                            if nei not in cset1 and nei not in p and nei not in dist[1]:
                                up_d = d + G[nei][end][tp]
                                up_p = p + [nei]
                                push(fringe[0], (up_d, up_p))
                else:
                    if len(p)>1:
                        dist[0].setdefault(end, list()).append((d, p))
                    for nei in G.adj[end].keys():
                        if nei not in cset1 and nei not in p:
                            up_d = d + G[nei][end][tp]
                            up_p = p + [nei]
                            push(fringe[0], (up_d, up_p))

                # backward
                if fringe[1]:
                    (d, p) = pop(fringe[1])
                    end = p[-1]

                    if end in dist[0]:
                        continue
                    else:
                        if len(p)>1:
                            dist[1].setdefault(end, list()).append((d, p))
                        for nei in G.adj[end].keys():
                            if nei not in p and nei not in cset2:
                                up_d = d + G[nei][end][tp]
                                up_p = p + [nei]
                                push(fringe[1], (up_d, up_p))

        raise ValueError('no paths more between two clusters.')































