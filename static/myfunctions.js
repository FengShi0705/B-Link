
// get the text in inputbox
function get_inputtext(){
  return d3.select('input[name="keywords"]').node().value;
};


// show localgraph for search text using force SIMULATION
function force_v4(dataset){
  //scale
  scale_Fw2Distance = d3.scalePow().exponent(-2)
                   .domain([ d3.min(dataset.edges,function(d){return d.Fw}), d3.max(dataset.edges,function(d){return d.Fw})  ])
                   .range([minlinkdistance,maxlinkdistance]);

  scale_Fw2Stokewidth = d3.scalePow().exponent(-2)
                    .domain([ d3.min(dataset.edges,function(d){return d.Fw}), d3.max(dataset.edges,function(d){return d.Fw})  ])
                    .range([maxlinkwidth,minlinkwidth]);

  scale_NodeRadius = d3.scalePow().exponent(3)
                        .domain([ d3.min( dataset.nodes , function(d){return d.N}) , d3.max( dataset.nodes , function(d){return d.N}) ])
                        .range([minNodeRadius,maxNodeRadius]);

  //define SIMULATION
  SIMULATION = d3.forceSimulation()
                     .force("link",d3.forceLink().id(function id(d){return d.wid;})) //add spring
                     .force("charge", d3.forceManyBody())  //repel each other
                     .force("center", d3.forceCenter(w / 2, h / 2)) // force to center
                     .nodes(dataset.nodes);

  //customize force
  SIMULATION.force("link")
            .links(dataset.edges)
            .distance(function(d){ return scale_Fw2Distance(d.Fw); });

  //remove svg, and create svg
  d3.selectAll("#maincanvas").remove();
  SVG = d3.select("svg#Mainback")
          .insert("g",":first-child")
          .attr("id","maincanvas");

  BACKLAYER = SVG.append("rect")
               .attr("id","Backlayer")
               .attr("width", w)
               .attr("height", h);

  //change title color
  TITLECOLOR_CHANGE();


  var edges=SVG.selectAll(".edge")
               .data(dataset.edges)
               .enter()
               .append("line")
               .attr("class","edge")
               .attr("stroke-width",function(d){return scale_Fw2Stokewidth(d.Fw);});

  var edgelabels=SVG.selectAll(".edgelabel")
                    .data(dataset.edges)
                    .enter()
                    .append("text")
                    .attr("class","edgelabel")
                    .text(function(d){return d.Fw;})
                    .style("opacity","0");

  var gnodes=SVG.selectAll(".gnode")
               .data(dataset.nodes)
               .enter()
               .append("g")
               .attr("class","gnode")
               .call(d3.drag()
               .on("start", dragstarted)
               .on("drag", dragged)
               .on("end", dragended));


  gnodes.append("text")
         .attr("dy",-10)
         .text(function(d){return d.label;})
         .style("opacity","0");

  gnodes.append("circle")
         .attr("r",function(d){return scale_NodeRadius(d.N);});

  TICK = function(){
      edges.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

      gnodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      edgelabels.attr("x", function(d) { return (d.source.x+d.target.x)/2; })
      .attr("y", function(d) { return (d.source.y+d.target.y)/2; });
  };
  SIMULATION.on("tick",TICK);

  function dragstarted(d) {
       if (!d3.event.active) SIMULATION.alphaTarget(0.3).restart();
       d.fx = d.x;
       d.fy = d.y;
  };

  function dragged(d) {
       d.fx = d3.event.x;
       d.fy = d3.event.y;
  };

  function dragended(d) {
       if (!d3.event.active) SIMULATION.alphaTarget(0);
       d.fx = null;
       d.fy = null;
  };

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
function highlight_wordrank(dataset){
    //not fade
    d3.selectAll(".gnode").selectAll("circle").transition().style("opacity","1");
    d3.selectAll(".gnode").selectAll("text").transition().style("opacity","1");
    d3.selectAll(".edge").transition().style("opacity","1");

    // generate a highlighted graph based on how many nodes we want to highlight among the top relevant words and corresponding paths
    var hltG=new jsnx.Graph();;
    for (var i = 0; i < Math.min(dataset.length, HltNodesNumber); i++){
        hltG.addNode(dataset[i][0]);
        hltG.addPath(dataset[i][1]);
    };

    //transparent nodes
    var fadenodes=d3.selectAll(".gnode").filter(function(d){return !(hltG.hasNode(d.wid));});
    fadenodes.selectAll("circle").transition().style("opacity","0.1");
    fadenodes.selectAll("text").transition().style("opacity","0.1");


    //transparent edges
    var fadeedges=d3.selectAll(".edge").filter(function(d){return !(hltG.hasEdge(d.source.wid,d.target.wid)) ;});
        fadeedges.transition().style("opacity","0.1");

    //change title color
    TITLECOLOR_CHANGE();

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