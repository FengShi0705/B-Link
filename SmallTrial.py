import networkx as nx
import numpy as np
from sklearn.cluster import spectral_clustering
from sklearn.utils.graph import graph_laplacian


G=nx.read_gpickle('data/undirected(fortest).gpickle')

A = nx.adjacency_matrix(G,G.nodes()[:-1],weight='weight')
A=A.toarray()
Tri=np.diag(np.sum(A,axis=1))
L=Tri-A
Ls, dd = graph_laplacian(A,normed=True, return_diag=True)
sqrt_Tri=np.sqrt(Tri)

c={}
c[1]=np.array([1,0,0,0,0])
c[2]=np.array([0,1,0,0,0])
c[3]=np.array([0,0,1,0,0])
c[4]=np.array([0,0,0,1,1])

sum=0

for ar in c.values():
    u=sqrt_Tri.dot(ar)/np.linalg.norm(sqrt_Tri.dot(ar))
    sum=sum+u.dot(Ls).dot(u.T)

print sum

