# B-Link
This is the code repository for B-Link. 

# Open source data:

Python version: 2.7.11

Pandas version: 0.24.2

Networkx version: 1.11

The b-link souce data mainly contains two parts, i.e. (1) a networkx gpickle file representing the graph structure, and (2) a csv file representing the mapping between 
node id and the node text.

## 1. networkx gpickle
The networkx gpickle file can be downloaded [here](https://b-link.s3.eu-west-2.amazonaws.com/addNodeEdgeDegree_R%2Brn%2BGMHM_undirected_alpha0.65_nodeD1.0_total_v3_csvneo4j.gpickle). It represents the main graph structure of [B-Link](http://www.b-link.uk/).

To use the networkx graph:
```
>>> import networkx as nx
>>> G= nx.read_gpickle('../addNodeEdgeDegree_R+rn+GMHM_undirected_alpha0.65_nodeD1.0_total_v3_csvneo4j.gpickle')
>>> G[1048581][343561]
{'weight': 2.0, 'R_r_HM': 85.00000000000001, 'maxAlpha': 0.8335867548824862, 'R_n_HM': 29120.999999999975, 'minAlpha': 0.7497914234110472, 'R_r_GM': 3.3576916931673404, 'R_n_GM': 10.279214842380336}
```

The code above check the edge between node(1048581) and node(343561). It shows the attributes attached with the edge. Some of these attributes (`R_n_HM
`, `R_r_GM`, `R_n_GM`) are used as edge distance in [B-Link](http://www.b-link.uk/), which always try to provide the results with shortest distance.
 1. "weight": refers to the raw occurrence frequency of this two nodes in the publication in terms of sentence as well as keywords section.
 2. "R_n_HM": refers to a type of precomputed distance between this two nodes. This is used as the edge distance in the `Explore-General` function in [B-Link](http://www.b-link.uk/)
 3. "R_r_GM": refers to a type of precomputed distance between this two nodes. This is used as the edge distance in the `Explore-Specific` and `Search Path - Professional` functions in [B-Link](http://www.b-link.uk/).
 4. "R_n_GM": refers to a type of precomputed distance between this two nodes. This is used as the edge distance in the `Search Path - Basic` function in [B-Link](http://www.b-link.uk/).

Regarding how to compute the disance between nodes, please refer to paper [1]

## 2. csv node id map
The csv file represents the mapping between node id and node phrase/text. It can be downloaded [here](https://b-link.s3.eu-west-2.amazonaws.com/node_words.gz).

To check the mapping:
```
>>> import pandas as pd
>>> df = pd.read_csv('node_words.gz',compression='gzip')
>>> df
              id                           word
0        2029856  !continuing medical education
1        1929261               !kung bushman(ju
2        1003006                              #
3        3041529           #15μ10#δ6-desaturase
4        1133049                            #60
5        2386300                  #bis-hardness
6        1319240                           #csp
7        2385232                    #euromaidan
8        1800821                           #fal
9         584050                         #k-sat
10        580867                             #p
11       1183304            #p complexity class
12       3054833            #p hard enumeration
...
```

The `id` column is the id referred by the nodes in networkx graph, and the `word` column is the phrase/text of the node.

# Reference
[1] Shi, F., Chen, L., Han, J. and Childs, P., 2017. A data-driven text mining and semantic network analysis for design information retrieval. Journal of Mechanical Design, 139(11).
