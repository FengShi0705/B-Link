import PubFunctions
import networkx as nx
import datetime

# The main function use original keywords table and relations table of a schema.
# And create three forms of graph:
# 1. undirected graph with undirected weights and domian dissimilarity
# 2. one-directed graph with undirected weights, domian dissimilarity, and G2S direction
# 3. bi-directed graph with forwards and backwards directed weights
# Finally, write these three graphs into gpickle

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



#Checked OK
def main(schema,reltable,labtable,tp):

    write_undirected(schema,reltable,labtable)
    write_onedirected(schema,reltable,labtable,tp)
    write_bidirected(schema,reltable,labtable,tp)

    print 'All finished'

    return


