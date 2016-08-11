import networkx as nx
import numpy as np
from sklearn.cluster import spectral_clustering
from sklearn.utils.graph import graph_laplacian
from sklearn.utils.arpack import eigsh
from sklearn.cluster.k_means_ import k_means
import math


def original_cluster(k):
    G = nx.read_gpickle('data/undirected(fortest).gpickle')
    A = nx.adjacency_matrix(G,nodelist=G.nodes()[:-1],weight='weight')
    labels=spectral_clustering(A,n_clusters=k,eigen_solver='arpack')
    return labels

def my_uniteigenvector_zeroeigenvalue_cluster(k):
    G = nx.read_gpickle('data/undirected(fortest).gpickle')
    A = nx.adjacency_matrix(G, nodelist=G.nodes()[:-1], weight='weight')
    #A=A.toarray()
    #np.fill_diagonal(A,0.01) #add node with its own weight to itself
    #Tri = np.diag(np.sum(A, axis=1))
    #L = Tri - A
    #Tri_1 = np.diag(np.reciprocal(np.sqrt(Tri).diagonal()))
    #Ls = Tri_1.dot(L).dot(Tri_1)

    Ls, dd = graph_laplacian(A,normed=True, return_diag=True)

    eigenvalue_n, eigenvector_n = eigsh(Ls*(-1), k=k,
                                   sigma=1.0, which='LM',
                                   tol=0.0)

    #for ic,vl in enumerate(eigenvalue_n):
    #    if abs(vl-0)<=1e-10:
    #        eigenvector_n[:, ic] = np.full(len(G.nodes()[:-1]),1.0 / math.sqrt(len(G.nodes()[:-1]))) # zero eigenvalue

    eigenvector_n[:, -1] = np.full(len(G.nodes()[:-1]), 1.0 / math.sqrt(len(G.nodes()[:-1])))  # zero eigenvalue

    for ir,n in enumerate(eigenvector_n):
        eigenvector_n[ir]=n/float(np.linalg.norm(n))  # normalize to unitvector

    _, labels, _ = k_means(eigenvector_n, k, random_state=None,
                           n_init=100)
    return labels






G=nx.read_gpickle('data/undirected(fortest).gpickle')
A = nx.adjacency_matrix(G,G.nodes(),weight='weight')
A=A.toarray()
np.fill_diagonal(A,0.1)
Tri=np.diag(np.sum(A,axis=1))
L=Tri-A
Tri_1=np.diag(np.reciprocal(np.sqrt(Tri).diagonal()))
Ls=Tri_1.dot(L).dot(Tri_1)
#Ls, dd = graph_laplacian(A,normed=True, return_diag=True)
sqrt_Tri=np.sqrt(Tri)

c={}
c[1]=np.array([1,0,0,0,0,0])
c[2]=np.array([0,1,0,0,0,0])
c[3]=np.array([0,0,0,1,0,0])
c[4]=np.array([0,0,0,0,0,1])
c[5]=np.array([0,0,1,0,1,0])

sum=0

for ar in c.values():
    u=sqrt_Tri.dot(ar)/np.linalg.norm(sqrt_Tri.dot(ar))
    sum=sum+u.dot(Ls).dot(u.T)

print sum

