import threading
import time
from Private import PF
import json


def create_userInteractData_Table(schema):
    """
    create a table to store the activities of the user
    1. only store the user data when using Global setting.
    2. If type is explore, save the original record order.
    If primary key is same, assert position is same, count +1
    3. If type is find path, save the path from small id to bigger id.
    If primary key is same, assert position is same, count +1
    4. If type is B path, save the path from small id to bigger id.
    If primary key is same, update the position to later position, count +1
    5. If type is search, record_wid is the id of the word, record_label is the label of the search word.
    position always remain to 1, count +1

    create another table to store the error or empty result of the user
    1. If type is search button, start_label is the user's query. count+1
    2. If type is explore, start_label is the user's query and start_id is the wid of this query. count+1
    3. If type is path, start_id is the smaller id, start_label is the word label of smaller id. End_id is the larger id,
        End_label is the word label of larger. count +1
    4. If type is Bpath, start_id is the id list of cluster1, start_label are the list of corresponding labels.
        end_id is the id list of cluster2, end_label are the list of corresponding labels. count +1

    :param schema: is the schema to create the table
    :return:
    """
    cnx, cursor=PF.creatCursor(schema,'W')
    Qy=("""
        create table `user_record`
        (
            `data_version` varchar(200) not null,
            `distance_type` varchar(200) not null,
            `eid` varchar(200) not null,
            `query_type` varchar(200) not null,
            `record_wid` varchar(1000) not null,
            `record_label` varchar(2000) not null,
            `position` int unsigned not null,
            `count` int default 0 not null,
            `datetime` DATETIME not null,
            primary key (`data_version`(100),`distance_type`(100),`eid`(100),`query_type`(100),`record_wid`(255)),
            index(`distance_type`),
            index(`eid`),
            index(`query_type`),
            index(`position`),
            index(`count`),
            index(`datetime`)
        )
        """)

    cursor.execute(Qy)

    errorQy = ("""
            create table `user_error`
            (
                `data_version` varchar(200) not null,
                `distance_type` varchar(200) not null,
                `eid` varchar(200) not null,
                `query_type` varchar(200) not null,
                `start_id` varchar(300) null,
                `start_label` varchar(1000) not null,
                `end_id` varchar(300) null,
                `end_label` varchar(1000) null,
                `count` int default 0 not null,
                `datetime` DATETIME not null,
                primary key (`data_version`(64),`distance_type`(64),`eid`(64),`query_type`(64),`start_id`(255),`start_label`(255),`end_id`(255)),
                index(`distance_type`),
                index(`eid`),
                index(`query_type`),
                index(`count`),
                index(`datetime`)
            )
            """)
    cursor.execute(errorQy)

    cnx.commit()
    cursor.close()
    cnx.close()

    return

class record_thread(threading.Thread):
    def __init__(self,userSchema,data_version,distance_type,user,query_type,record_wids,record_labels,position):
        threading.Thread.__init__(self)
        self.userSchema = userSchema
        self.cnx, self.cursor = PF.creatCursor(self.userSchema, 'W')
        self.data_version=data_version
        self.distance_type = distance_type
        self.eid = user
        self.query_type = query_type
        self.record_wids = record_wids[0:]
        self.record_labels = record_labels[0:]
        self.position = position

    def run(self):
        for i,record in enumerate(self.record_wids):
            if self.query_type == 'search' or self.query_type == 'get_Rel_one':
                record_wid = record
                record_label = self.record_labels[i]
                current_position = self.get_position(record_wid)
                newposition = self.position + i
                if current_position == -1:
                    self.insert_newline(record_wid, record_label, newposition)
                else:
                    assert current_position == newposition, 'position does not remain same in the explore or search function'
                    self.addCount_updateTime(record_wid)

            elif self.query_type == 'find_paths':
                record_wid = record
                record_label = self.record_labels[i]
                if record_wid[0]>record_wid[-1]:
                    record_wid =record_wid[::-1]
                    record_label = record_label[::-1]
                current_position = self.get_position(record_wid)
                newposition = self.position + i
                if current_position==-1:
                    self.insert_newline(record_wid,record_label,newposition)
                else:
                    assert current_position==newposition, 'position does not remain same in the find_paths function'
                    self.addCount_updateTime(record_wid)

            elif self.query_type == 'find_paths_clusters':
                record_wid = record
                record_label = self.record_labels[i]
                if record_wid[0] > record_wid[-1]:
                    record_wid = record_wid[::-1]
                    record_label = record_label[::-1]
                current_position = self.get_position(record_wid)
                newposition = self.position + i
                if current_position == -1:
                    self.insert_newline(record_wid, record_label, newposition)
                else:
                    if newposition>current_position:
                        self.update_position(record_wid,newposition)
                    self.addCount_updateTime(record_wid)


        self.cnx.commit()

    def get_position(self,record_wid):
        Qy = ("""
                SELECT `position` from `user_record` where `data_version`=\'{}\' and `distance_type`=\'{}\' and `eid`=\'{}\' and `query_type`=\'{}\' and `record_wid`=\'{}\'
        """.format(self.data_version,self.distance_type,self.eid,self.query_type,json.dumps(record_wid)))
        print Qy
        self.cursor.execute(Qy)
        position = self.cursor.fetchall()
        assert len(position) <= 1, 'more than one position found, duplicated primary key'
        if len(position) == 1:
            return position[0][0]
        else:
            return -1

    def insert_newline(self,record_wid,record_label,position):
        Qy = ("""
            insert into `user_record` (`data_version`, `distance_type`, `eid`,`query_type`,`record_wid`,`record_label`,`position`,`count`,`datetime`)
            VALUES (\'{}\',\'{}\',\'{}\',\'{}\',\'{}\',\'{}\',{},1,\'{}\')
        """.format(self.data_version, self.distance_type, self.eid, self.query_type, json.dumps(record_wid),json.dumps(record_label), position,time.strftime('%Y-%m-%d %H:%M:%S'))
              )
        self.cursor.execute(Qy)

    def addCount_updateTime(self,record_wid):
        Qy=("""
            update `user_record`
            set
            `count`=`count`+1,
            `datetime` = \'{}\'
            where `data_version`=\'{}\' and `distance_type`=\'{}\' and `eid`=\'{}\' and `query_type`=\'{}\' and `record_wid`=\'{}\'
        """.format(time.strftime('%Y-%m-%d %H:%M:%S'),self.data_version,self.distance_type,self.eid,self.query_type,json.dumps(record_wid)))

        self.cursor.execute(Qy)

    def update_position(self,record_wid,position):
        Qy = ("""
            update `user_record`
            set `position`={}
            where `data_version`=\'{}\' and `distance_type`=\'{}\' and `eid`=\'{}\' and `query_type`=\'{}\' and `record_wid`=\'{}\'
        """.format(position,self.data_version, self.distance_type, self.eid, self.query_type, json.dumps(record_wid)))

        self.cursor.execute(Qy)





class mythread1(threading.Thread):
    def __init__(self,a,count):
        threading.Thread.__init__(self)
        self.count=count
        self.a=a

    def run(self):
        time.sleep(1.1)
        for i in xrange(0,self.count):
            time.sleep(1)
            self.a +=1
            print 'sub: ',self.a


class mythread2(threading.Thread):
    def __init__(self,a,count):
        threading.Thread.__init__(self)
        self.count=count
        self.a=a

    def run(self):
        time.sleep(1.2)
        for i in xrange(0,self.count):
            time.sleep(1)
            self.a +=1
            print 'sub: ',self.a



if __name__ == '__main__':
    a=0
    #a.append(0)
    thread1=mythread1(a,5)
    thread2 = mythread2(a, 6)
    thread1.start()
    thread2.start()
    time.sleep(1)
    while True:
        time.sleep(1)
        print 'main: ', a
        if not thread1.isAlive() and not thread2.isAlive():
            break


