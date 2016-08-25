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
  var edges=SVG.selectAll(".edge")
               .data(SIMULATION.force("link").links(),function(d){return Math.min(d.source.wid,d.target.wid)+"-"+Math.max(d.source.wid,d.target.wid);});

          edges.attr("stroke-width",function(d){return scale_Fw2Stokewidth(d.Fw);});
          edges.enter()
               .append("line")
               .attr("class","edge")
               .attr("stroke-width",function(d){return scale_Fw2Stokewidth(d.Fw);});
          edges.exit().remove();

  var edgelabels=SVG.selectAll(".edgelabel")
                    .data(SIMULATION.force("link").links(),function(d){return Math.min(d.source.wid,d.target.wid)+"-"+Math.max(d.source.wid,d.target.wid);});

          edgelabels.enter()
                    .append("text")
                    .attr("class","edgelabel")
                    .text(function(d){return d.Fw;});
          edgelabels.exit().remove();

  var gnodes = SVG.selectAll(".gnode")
               .data(SIMULATION.nodes(),function(d){return d.wid;});

      gnodes.selectAll("circle").transition('Radius').attr("r",function(d){return scale_NodeRadius(d.N);});

  var newgnodes=gnodes.enter()
               .append("g")
               .attr("class","gnode")
               .call(d3.drag()
               .on("start", dragstarted)
               .on("drag", dragged)
               .on("end", dragended));
  newgnodes.append("text")
         .attr("dy",-10)
         .text(function(d){return d.label;});
  newgnodes.append("circle").transition('Radius')
         .attr("r",function(d){return scale_NodeRadius(d.N);});

  gnodes.exit().remove();

  // restart simulation
  SIMULATION .alphaTarget(0.3).restart();

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
   neighbor_tracks=SVG.selectAll(".neighbor_track")
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

// wordrank highlight relevant words and corresponding paths
function highlight_nodespaths(dataset){
    // generate a highlighted graph based on how many nodes we want to highlight among the top relevant words and corresponding paths
    var hltG=new jsnx.Graph();
    for (var i = 0; i < dataset.paths.length; i++){
        hltG.addNode(dataset.paths[i][0]);
        hltG.addPath(dataset.paths[i]);
    };
    // all nodes color
    d3.selectAll(".gnode").selectAll("circle").each(function(d){
        if( _.contains(dataset.nodes, d.wid) ){
            d3.select(this).transition('color').style('fill',HltQueryColor);
        }else if( hltG.hasNode(d.wid) ){
            d3.select(this).transition('color').style('fill',HltPathColor);
        }else{
            d3.select(this).transition('color').style('fill',NodeColor);
        };
    });
    //all edges color
    d3.selectAll(".edge").transition('color').style('stroke',function(d){
        if( hltG.hasEdge(d.source.wid,d.target.wid) ){
            return HltPathColor;
        }else{
            return EdgeColor;
        };
    });
    //change title color
    TITLECOLOR_CHANGE();
};

function ZoomToNodes(nodes){
    var obj_nodes = d3.selectAll('.gnode').filter(function(d){return _.contains(nodes,d.wid);});
    obj_nodes = obj_nodes.data();
    if(obj_nodes.length == 1){
        var k=4;
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