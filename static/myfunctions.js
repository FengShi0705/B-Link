//assert like python
function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}



// get the text in inputbox
function get_inputtext(){
  return d3.select('input[name="keywords"]').node().value;
};

// Get an array which consists of the values of a paticular key of objects in another array
function CURRENT_NODESSET(nodes,key){
    var nodesset=[];
    nodes.forEach(function(d){
        nodesset.push(d[key]);
    });
    return nodesset;
};

// update force layout
function SHOW_UPDATE_FORCE(dataset,born){

  // born postion and velocity of new nodes
  /*born = bornplace
  if(query_exist_in_local){
      var born = CLIENT_NODES.filter(function(obj){return obj["wid"]==dataset.query;})[0];
  }else if(CLIENT_NODES.length==0){
      var born = {x:NaN,y:NaN,vx:NaN,vy:NaN};
  }else{
      var born = {x:w/2, y:h/2, vx:NaN, vy: NaN};
  };*/

  //update and add nodes
  dataset.allnodes.forEach(function(d){
      var cnode = CLIENT_NODES.filter(function(obj){return obj['wid']==d.wid;});

      if(cnode.length==0){//add new nodes
          d.x = born.x;
          d.y = born.y;
          d.vx = born.vx;
          d.vy = born.vy;
          CLIENT_NODES.push(d);
          CLIENT_NODES_ids.push(d.wid);
      }else{ // update existing nodes degree
          cnode=cnode[0];
          cnode.n=d.n;
          cnode.N=d.N;
      };
  });


  CLIENT_EDGES=dataset.alledges;
  // update simulation
  SIMULATION.nodes(CLIENT_NODES);
  SIMULATION.force("link").links(CLIENT_EDGES);


  //scale
  scale_Fw2Distance = d3.scalePow().exponent(-2)
                   .domain([ d3.min(CLIENT_EDGES,function(d){return d.Fw}), d3.max(CLIENT_EDGES,function(d){return d.Fw})  ])
                   .range([minlinkdistance,maxlinkdistance]);

  scale_Fw2Stokewidth = d3.scalePow().exponent(-2)
                    .domain([ d3.min(CLIENT_EDGES,function(d){return d.Fw}), d3.max(CLIENT_EDGES,function(d){return d.Fw})  ])
                    .range([maxlinkwidth,minlinkwidth]);

  scale_NodeRadius = d3.scalePow().exponent(3)
                        .domain([ d3.min( CLIENT_NODES , function(d){return d.N}) , d3.max( CLIENT_NODES , function(d){return d.N}) ])
                        .range([minNodeRadius,maxNodeRadius]);

  //update link distance
  SIMULATION.force("link").distance(function(d){return scale_Fw2Distance(d.Fw);});

  //change title color
  TITLECOLOR_CHANGE();
  //update svg
  var edges=GRAPH.selectAll(".edge")
               .data(SIMULATION.force("link").links(),function(d){return Math.min(d.source.wid,d.target.wid)+"-"+Math.max(d.source.wid,d.target.wid);});

          edges.attr("stroke-width",function(d){return scale_Fw2Stokewidth(d.Fw);});
          edges.enter()
               .insert("line",":first-child")
               .attr("class","edge")
               .attr("stroke-width",function(d){return scale_Fw2Stokewidth(d.Fw);});
          edges.exit().remove();

  var edgelabels=GRAPH.selectAll(".edgelabel")
                    .data(SIMULATION.force("link").links(),function(d){return Math.min(d.source.wid,d.target.wid)+"-"+Math.max(d.source.wid,d.target.wid);});

          edgelabels.enter()
                    .append("text")
                    .attr("class","edgelabel")
                    .text(function(d){return d.Fw;});
          edgelabels.exit().remove();

  var gnodes = GRAPH.selectAll(".gnode")
               .data(SIMULATION.nodes(),function(d){return d.wid;});

      gnodes.select("circle").transition('Radius').attr("r",function(d){return scale_NodeRadius(d.N);});

  var newgnodes=gnodes.enter()
               .append("g")
               .attr("class","gnode")
               .call(d3.drag()
               .on("start", dragstarted)
               .on("drag", dragged)
               .on("end", dragended));

  newgnodes.append("circle").transition('Radius')
         .attr("r",function(d){return scale_NodeRadius(d.N);});
  newgnodes.append("text")
         .attr("dy",-10)
         .text(function(d){return d.label;});

  gnodes.exit().remove();

  // restart simulation
  SIMULATION .alphaTarget(0.5).restart();

};

// transform localgraph to circle-layout according to the neighbor-level
function circle_layout_neighbor(dataset){
   var level = dataset["disconnected"].length? Object.keys(dataset).length-1 : Object.keys(dataset).length-2 ;
   scale_Rnei=d3.scaleLinear().domain([1,level]).range([d3.min([w,h])/4,d3.min([w,h])/2-maxNodeRadius]);

   // remove force
   SIMULATION.force("link").strength(0);
   SIMULATION.force("center",null);
   SIMULATION.force("charge",null);

   function Get_CoordX(cx,i,n,R,l){
       var theta=2*Math.PI/level*(l-1)+2*Math.PI/n*i;
       var x=cx+ R*Math.cos(theta);
       return Math.round(x);
   };
   function Get_CoordY(cy,i,n,R,l){
       var theta=2*Math.PI/level*(l-1)+2*Math.PI/n*i;
       var y=cy- R*Math.sin(theta);
       return Math.round(y);
   };

   SIMULATION.force("xp",d3.forceX());
   SIMULATION.force("xp").x(function(d,i){
       for (var key in dataset){
           if (dataset[key].indexOf(d.wid)>=0){
               var l = key=="disconnected"? level:key ;
               var i = dataset[key].indexOf(d.wid);
               var n = dataset[key].length;
               break;
           };
       };

       if(l==0){
           var R=0;
       }else{
           var R=scale_Rnei(l)
       };

       var coor_x=Get_CoordX(w/2,i,n,R,l);
       return coor_x;
   })
   .strength(POSITIONFORCE_STRENGTH);

   SIMULATION.force("yp",d3.forceY());
   SIMULATION.force("yp").y(function(d,i){
       for (var key in dataset){
           if (dataset[key].indexOf(d.wid)>=0){
               var l = key=="disconnected"? level:key;
               var i = dataset[key].indexOf(d.wid);
               var n = dataset[key].length;
               break;
           };
       };

       if(l==0){
           var R=0;
       }else{
           var R=scale_Rnei(l)
       };

       var coor_y=Get_CoordY(h/2,i,n,R,l);
       return coor_y;
   })
   .strength(POSITIONFORCE_STRENGTH);

   d3.selectAll(".neighbor_track").remove();
   neighbor_tracks=GRAPH.selectAll(".neighbor_track")
                      .data(_.range(1,level+1))
                      .enter()
                      .append("circle")
                      .attr("class","neighbor_track")
                      .attr("cx",w/2)
                      .attr("cy",h/2)
                      .moveToBack()
                      .transition(tran)
                      .attr("r",function(d){return scale_Rnei(d);});


   SIMULATION.alphaTarget(0.3).restart();
   //change title color
   TITLECOLOR_CHANGE();
};

// highlight dataset.paths and dataset.paths1 in different style, and dataset.nodes which are highlighted in a different style as well.
// dataset.nodes is a list of nodes
// Both dataset.paths and dataset.paths1 are list of paths
function highlight_nodespaths(dataset){
    // generate a highlighted graph based on dataset.paths
    var hltG = new jsnx.Graph();
    for (var i = 0; i < dataset.paths.length; i++){
        hltG.addPath(dataset.paths[i]);
    };
    var hltG1=new jsnx.Graph();
    for (var i = 0; i < dataset.paths1.length; i++){
        hltG1.addPath(dataset.paths1[i]);
    };

    // all nodes color
    d3.selectAll(".gnode").selectAll("circle").each(function(d){
        if( _.contains(dataset.nodes, d.wid) ){
            d3.select(this).attr('class','hltA');
        }else if( hltG.hasNode(d.wid) ){
            d3.select(this).attr('class','hltP');
        }else if( hltG1.hasNode(d.wid) ){
            d3.select(this).attr('class','hltP1');
        }else{
            d3.select(this).attr('class','');
        };
    });
    //all edges color
    d3.selectAll(".edge").each(function(d){
        if( hltG.hasEdge(d.source.wid,d.target.wid) ){
            d3.select(this).attr('class','edge hltE');
        }else if( hltG1.hasEdge(d.source.wid,d.target.wid) ){
            d3.select(this).attr('class','edge hltE1');
        }else{
            d3.select(this).attr('class','edge');
        };
    });
    //change title color
    TITLECOLOR_CHANGE();
};

// zooming to multiple nodes so that the nodes fill up the screen.nodes is a list
function ZoomToNodes(nodes){
    var obj_nodes = d3.selectAll('.gnode').filter(function(d){return _.contains(nodes,d.wid);});
    obj_nodes = obj_nodes.data();
    if(obj_nodes.length == 1){
        var k = 1;
        var x=obj_nodes[0].x
        var y=obj_nodes[0].y
    }else{
        var max_x=d3.max(obj_nodes,function(d){return d.x});
        var max_y=d3.max(obj_nodes,function(d){return d.y});
        var min_x=d3.min(obj_nodes,function(d){return d.x});
        var min_y=d3.min(obj_nodes,function(d){return d.y});
        var x = (max_x+min_x)/2;
        var y = (max_y+min_y)/2;
        var kx = w/(max_x-min_x+4*maxNodeRadius);
        var ky = h/(max_y-min_y+4*maxNodeRadius);
        var k = Math.min(kx,ky);
        console.log(k);
    };
    function transform(){
        return d3.zoomIdentity
                 .translate(w/2,h/2)
                 .scale(k)
                 .translate(-x,-y);
    };
    BACKLAYER.transition('zoom').duration(3000).call(BACKLAYER_Zoom.transform, transform);
};

// Back to force layout
function RedoBack(){
    //resume color
    d3.selectAll(".gnode").selectAll("circle").transition().style("opacity","1");
    d3.selectAll(".gnode").selectAll("text").transition().style("opacity","1");
    d3.selectAll(".edge").transition().style("opacity","1");
    // remove neighbor track
    d3.selectAll("circle.neighbor_track").remove();
    //add force
    SIMULATION.force("link").strength(function(d) {
        return 1 / Math.min(d.source.n, d.target.n);
    });
    SIMULATION.force("center", d3.forceCenter(w / 2, h / 2));
    SIMULATION.force("charge", d3.forceManyBody());
    //remove force
    SIMULATION.force("xp",null);
    SIMULATION.force("yp",null);
    SIMULATION.alphaTarget(0.3).restart();
    //change title color
    TITLECOLOR_CHANGE();
};


//get the value of minhops
function get_minhops(){
    return parseInt(d3.select('select.minhop').node().value);
};
// check swith is either local or global
function check_explore_LG(){
    if( d3.select('label.switch input[name="switch-1"]').node().checked==true ){
        return 'local';
    }else{
        return 'global';
    };
};

// Explore either global or local graph
// Start or Previous or Next
// Query is the queried node to be highlighted
// born is the wid of the node as the bornplace.
function Explore_Nearby(LorG,start,N,query,born){
    var currentnodes = CLIENT_NODES_ids;
    if ( LorG=="local" ){
        var subparameters = {'ipt':query,'tp':Type_distance,'minhops':get_minhops(),'localnodes':currentnodes};
        var parameters = {'N':N,'parameters':subparameters,'generator':'get_Rel_one','start':start};
        var info = {'explorelocal':true,'parameters':parameters,'localnodes':null};
    }else{
        var subparameters = {'ipt':query,'tp':Type_distance,'minhops':get_minhops(),'localnodes':null};
        var parameters = {'N':N,'parameters':subparameters,'generator':'get_Rel_one','start':start};
        var info = {'explorelocal': false, 'parameters':parameters,'localnodes':currentnodes};
    };
    //calculate bornplace
    assert( _.contains(currentnodes,born), 'current nodes do not include born node');
    var bornnode = CLIENT_NODES.filter(function(obj){return obj["wid"]==born;})[0];
    var bornplace = {x:bornnode.x, y:bornnode.y, vx:bornnode.vx, vy: bornnode.vy};

    generator_update_graphAndPanel(info,bornplace,[query]);

};


// Access generator url, update force graph and information panel
// info for the generator server
// bornplace is the x,y,vx,vy for the newly added nodes
// h_nodes are the end nodes to be highlighted
function generator_update_graphAndPanel(info,bornplace,h_nodes){
    d3.json('/generator/'+JSON.stringify(info),function(error,data){
        if(data.AddNew==true){;
            SHOW_UPDATE_FORCE(data,bornplace); //add new node and update the graph displayed
            node_left_click_on();
        };
        var hlpath1 = [];
        var z_nodes =[];
        data.paths.forEach(function(d,i){
            if (i!=0){ hlpath1.push(d.ids); };
            z_nodes= _.union(z_nodes,d.ids);
        });
        var highlights={'nodes':h_nodes,'paths':[data.paths[0].ids],'paths1':hlpath1}; //highlight nodes and paths
        highlight_nodespaths(highlights);
        ZoomToNodes(z_nodes); // zoom to the node
        //update the information panel here
        update_informationPanel(data.paths,data.position);
    });
};

// paths are the information to be updated on the information panel
// position is the position of the current paths
function update_informationPanel(paths,position){
    d3.select('div#left-panel div#info-display').selectAll('div.row').remove();
    var inforow = d3.select('div#left-panel div#info-display')
                    .selectAll('div.row')
                    .data(paths)
                    .enter()
                    .append('div')
                    .attr('class','row');
    inforow.append('p').attr('class','list')
                       .text(function(d,i){
                           if(i==0){d3.select(this).style('background-color','#F2F3F4'); };
                           return parseInt(i)+position;
                       });
    inforow.append('div').attr('class','content')
                         .text(function(d){
                             if(i==0){ d3.select(this).style('background-color','#F2F3F4'); };
                             return d.labels.join(' > ');
                         });

    //information clickable
    d3.select('div#left-panel div#info-display').selectAll('div.row').on('click',function(d,i){
        d3.selectAll('div.row').style('background-color','white');
        d3.select(this).style('background-color','#F2F3F4');
        var hltP1=[];
        paths.forEach(function(p,pi){
            if(pi!=i){
                hltP1.push(p.ids);
            };
        });
        var highlights={'nodes':[d.ids[0], d.ids[d.ids.length-1]],'paths':[d.ids],'paths1':hltP1};
        highlight_nodespaths(highlights);
        ZoomToNodes(d.ids);
    });
};





//find paths between two nodes
function findPaths_betweenNodes(LorG, start, minhops, N, node1, node2){
    if ( LorG=="local" ){
        var subparameters = {"source":node1,"target":node2,"tp":Type_distance, "minhops":minhops, "localnodes":CLIENT_NODES_ids};
        var parameters={"N":N, "parameters":subparameters,"generator":'find_paths',"start":start};
        var info = {'explorelocal':true,'parameters':parameters,'localnodes':null};
    }else{
        var subparameters = {"source":node1,"target":node2,"tp":Type_distance,"minhops":minhops,"localnodes":null};
        var parameters={"N":N,"parameters":subparameters,"generator":"find_paths","start":start};
        var info = {"explorelocal":false,"parameters":parameters,"localnodes":CLIENT_NODES_ids};
    };
    // calculate bornplace
    assert( _.contains(CLIENT_NODES_ids,node1) && _.contains(CLIENT_NODES_ids,node2) , 'path ends do not exist!');
    var bornnode1=CLIENT_NODES.filter(function(obj){return obj["wid"]==node1;})[0];
    var bornnode2=CLIENT_NODES.filter(function(obj){return obj["wid"]==node2;})[0];
    var bornplace = {x:(bornnode1.x+bornnode2.x)/2, y:(bornnode1.y+bornnode2.y)/2, vx:(bornnode1.vx+bornnode2.vx)/2, vy: (bornnode1.vy+bornnode2.vy)/2 };

    generator_update_graphAndPanel(info, bornplace, [node1,node2]);
};
