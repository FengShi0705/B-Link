

var Spinner_Opts = {
  lines: 13 // The number of lines to draw
, length: 18 // The length of each line
, width: 14 // The line thickness
, radius: 42 // The radius of the inner circle
, scale: 0.5 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#000' // #rgb or #rrggbb or array of colors
, opacity: 0.25 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '50%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: 'absolute' // Element positioning
}
var Loading_Spinner = new Spinner(Spinner_Opts).spin(d3.select('.info-display').node());


d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

function GETRANDOMINT(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var TITLECOLOR_CHANGE = function(){
      d3.select("div.header").select("h1").transition().duration(1000).style("color",function(){
      var r=GETRANDOMINT(0,255);
      var g=GETRANDOMINT(0,255);
      var b=GETRANDOMINT(0,255);
      return "rgb(" + [r, g, b].join(",") + ")";
  });
};


var w=window.innerWidth || document.body.clientWidth;
var h=window.innerHeight || document.body.clientHeight;
var Width_infoPanel = 360;
var maxlinkdistance=200;
var minlinkdistance=50;
var maxlinkwidth=3;
var minlinkwidth=1;
var maxNodeRadius=20;
var minNodeRadius=8;
var tran = d3.transition()
             .duration(5000)
             .ease(d3.easeLinear);

var HltNodesNumber=20;
var POSITIONFORCE_STRENGTH=0.8;
var N_SearchButton=10;
var N_forPath = 5;
var Type_distance = 'Fw';
var Kernal_Weight = 'weight';
var N_ExploreFunctionpanel=20;
var HltPathColor = '#FF6800';
var NodeColor = '#3498DB';
var EdgeColor = '#aaa';
var FOCUSING_NODE = -1;
var FOCUSING_CLUSTER = -1;
//add svg
User_Zoom = d3.zoom()
              .scaleExtent([1/4,4])
              .on("zoom",zoomed);
SVG = d3.select('body').append('svg').attr('id',"Mainback").attr('width',w) .attr('height',h).call(User_Zoom);
function SVG_change_size(){
    w=window.innerWidth || document.body.clientWidth;
    h=window.innerHeight || document.body.clientHeight;
    SVG.attr('width',w) .attr('height',h);
    BACKLAYER.attr("width", w).attr("height", h);
};

//add  main canvas
GRAPH = SVG.append("g")
           .attr("id","MainGraph");


BACKLAYER = SVG.insert("rect",":first-child")
                  .attr("id","Backlayer")
                  .attr("width", w)
                  .attr("height", h);

//set nodes and edges and simulation
CLIENT_NODES=[];
CLIENT_NODES_ids=[];
CLIENT_EDGES=[];
//define SIMULATION
SIMULATION = d3.forceSimulation()
               .force("link",d3.forceLink().id(function id(d){return d.wid;}).links(CLIENT_EDGES)) //add spring
               .force("charge", d3.forceManyBody().strength(-100)) //repel each other
               //.force("center", d3.forceCenter(w / 2, h / 2)) // force to center
               .nodes(CLIENT_NODES);
// tick on
  TICK = function(){
      if( SIMULATION.alpha()>=0.49 ){
          SIMULATION.alphaTarget(0);
      };

      GRAPH.selectAll(".edge").attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

      GRAPH.selectAll(".gnode").attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      GRAPH.selectAll(".edgelabel").attr("x", function(d) { return (d.source.x+d.target.x)/2; })
      .attr("y", function(d) { return (d.source.y+d.target.y)/2; });
  };

  SIMULATION.on("tick",TICK);

// drag behavior

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
  function zoomed() {

  GRAPH.attr("transform", d3.event.transform);
};


/////////////////////////////////////////-----  HTML DESIGN ONLY below -----///////////////////////////////////////////

// hide information panel
function Hide_InfoPanel(){
    document.getElementById("info_panel").style.display = "none";

    cancelInfoHighlight();
};

function Hide_FuncPanel(){
    // document.getElementById("func-nav").style.display = "none";
    document.getElementById("point_show_results").style.display = "none";
    document.getElementById("line_show_results").style.display = "none";
};

function Show_FuncPanel(searchId){
    var search_To_funcP = {'keywords':'func-nav','point_textinput':'point_show_results','pathstart_textinput':'line_show_results','pathend_textinput':'line_show_results'};
    var panelId = search_To_funcP[searchId];

    //reset minhop and local or global
    reset_hops_switcher(panelId);

    d3.select('#'+panelId).style('display','block');
};

// CSS - search-box control
  function checkTextField(field) {
    if (field.value != '') {
        //d3.select('input[name="clear"]').style("visibility","visible");
        d3.select('input[name="search"]').style("opacity","0.8");
    }
    else{
        //d3.select('input[name="clear"]').style("visibility","hidden");
        d3.select('input[name="search"]').style("opacity","0.1");
        document.getElementById("func-nav").style.display = "none";
        Hide_FuncPanel();
        Hide_InfoPanel();
    }
  };

var clear_button=d3.select('input[name="clear"]');
    clear_button.on('click', function(){
        document.getElementById("func-nav").style.display = "none";
        document.getElementById("keywords").value = "";
        this.style.visibility = "hidden";
    });

// main search box setting //
 d3.selectAll("input#keywords, input#point_textinput").on('keydown',function(){
  var searchid=this.id;
  if (d3.event.keyCode==13){
      Handle_Search_Button(searchid);
  }else{
      Hide_FuncPanel();
      Hide_InfoPanel();
  };
});

 d3.selectAll("input#pathstart_textinput, input#pathend_textinput").on('keydown',function(){
  var seachid = this.id;
  if (d3.event.keyCode==13){
      Handle_pathSearchbutton(seachid);
  }else{
      Hide_FuncPanel();
      Hide_InfoPanel()
  };
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CSS - Global-local switch control
d3.selectAll('#switch-1,#switch-2,#switch-3').on('click',function(d){
    Hide_InfoPanel();
    if(this.id=='switch-3'){
        console.log('switch-3');
        resumeClusterColor();
    };
    d3.select(this.parentNode.parentNode.parentNode).select('.t-global').classed('t-global-toggle',function(d){return !d3.select(this).classed('t-global-toggle');});
    d3.select(this.parentNode.parentNode.parentNode).select('.t-local').classed('t-local-toggle',function(d){return !d3.select(this).classed('t-local-toggle');});
});

/*$(document).ready(function(){
    $('#switch-1').click(function(){
        console.log('click$')
        $('.t-global').toggleClass('t-global-toggle');
        $('.t-local').toggleClass('t-local-toggle');
    });
    $('#switch-2').click(function(){
        console.log('click$')
        $('.t-global').toggleClass('t-global-toggle');
        $('.t-local').toggleClass('t-local-toggle');
    });
    $('#switch-3').click(function(){
        $('.t-global').toggleClass('t-global-toggle');
        $('.t-local').toggleClass('t-local-toggle');
    });
});*/

// selet explore minhops
function change_exploreMinhop(){
    Hide_InfoPanel();
};

// show func-nav panel
function show_panel(panelname){

    //update search box according to highlighted nodes
    var wid = d3.select('input#keywords').data()[0];
    var label = NODE_IdToObj(wid).label;
    document.getElementById("mainSearchBox").style.display = "none";
    document.getElementById("func-nav").style.display = "none";
    document.getElementById(panelname).style.display = "block";

    if (panelname == "point"){
        document.getElementById('point_show_results').style.display = "block";
        //reset minhop and local or global
        reset_hops_switcher('point_show_results');
        // update search box
        d3.select('input#point_textinput').node().value = label;
        // attach data
        d3.select('input#point_textinput').data([wid]);
    };


    if ( panelname == "line" ){
        // update search box
        d3.select('input#pathstart_textinput').node().value = label;
        d3.select('input#pathend_textinput').node().value='';
        // attach data
        d3.select('input#pathstart_textinput').data([wid]);
        d3.select('input#pathend_textinput').data([null]);
    };

    if(panelname == "cluster"){
        //cancel query highlight
        cancelQyHighlight();
    };

}

// show results panel
function show_info(panelname){
    if (panelname == "point"){
        console.log('point show');
        document.getElementById("info_panel").style.top = "230px";
        Explore_showResult();
    }
    else if (panelname == "line"){
        console.log('line show');
        document.getElementById("info_panel").style.top = "260px";
        FindPath_showResult();
    }
    else if (panelname == "cluster"){
        document.getElementById("info_panel").style.top ="347px";
        BpathsClusters_showResult();
    };
    document.getElementById("info_panel").style.display = "block";

}

// close line function panel
function closePanel(panelname){
    Hide_InfoPanel();
    Hide_FuncPanel();
    cancelQyHighlight();
    if(panelname=='cluster') {
        cancelClusterColor();
    };
    document.getElementById("mainSearchBox").style.display = "block";
    document.getElementById("func-nav").style.display = "block";
    document.getElementById(panelname).style.display = "none";
}

// show the selected cluster setting option
function clusterSettingOption(){
    var option = document.getElementById("clusterMethod").value;
    if(option == "normalized"){
        document.getElementById("clusterMethod1Setting").style.display = 'block';
        document.getElementById("clusterMethod2Setting").style.display = 'none';
    }
    else if(option == "mcl"){
    document.getElementById("clusterMethod1Setting").style.display = 'none';
    document.getElementById("clusterMethod2Setting").style.display = 'block';
    };
}
// go back to cluster level 1 page
function backClusterLevel1(){
    document.getElementById("cluster_level_1").style.display = "block"
    document.getElementById("cluster_level_2").style.display = "none";
    //reset setting for Bpath panel
    d3.selectAll('select[name="selectCluster1"],select[name="selectCluster2"]')
          .style('background-color','white')
          .each(function(){
              this.value = "";
          });
    reset_hops_switcher('cluster');
    Hide_InfoPanel();
    resumeClusterColor();
};
// go to cluster level 2 page
function showClusterLevel2(){
    generate_Clusters();

    document.getElementById("cluster_level_1").style.display = "none";
    document.getElementById("cluster_level_2").style.display = "block";
    clusterPan("findPath");

}

// cluster input box control
$(document).ready(function(){
    var count = 1;
    $('#remBtn').hide();
    $("#addBtn").click(function(){
        var remove = "#field" + count;
        var iconCSS = 15+(count * 45);
        count = count + 1;
        var newIn = '<input id="field'+count+'" type="text" class="w3-input w3-border w3-round w3-hover-border-blue" style="height:45px;" placeholder="Point '+count+ '...">';
        var newS = '<div id="icon'+count+'" class="w3-display-topright material-icons w3-xxlarge cluster-searchicon" style="margin-top:'+iconCSS+'px; ">search</div>'
        var newInput = $(newIn);
        var newSBtn = $(newS);
        $("#field1").before(newInput);
        $("#field1").before(newSBtn);
        if (count == 5){
            $('#addBtn').hide();
        };
        if (count == 2){
            $('#remBtn').show();
        };
    });

    $('#remBtn').click(function(){
        var fieldID = "#field" + count;
        var iconID = "#icon" + count;
        $(iconID).remove();
        $(fieldID).remove();
        count = count - 1;
        if (count == 4){
            $('#addBtn').show();
        };
        if (count == 1){
            $('#remBtn').hide();
        };
    });

    /////////////////////// Fake drop-down list using jquery ///////////
    //////start path//////
    $('#clusterStartSelect').click(function(){
        $('#clusterStartList').slideToggle(150);
    });

    $('#clusterStartList a').click(function(){
        var listText = $(this).find('.listTxt').html();
        $('#start_select_text').html(listText);
    });

    $('#clusterStartList').click(function(){
        $(this).slideUp(150);
    });

    $('#mouseStart').mouseleave(function(){
        $('#clusterStartList').slideUp(150);
    });

    //////End path////////
    $('#clusterEndSelect').click(function(){
        $('#clusterEndList').slideToggle(150);
    });

    $('#clusterEndList a').click(function(){
        var listText = $(this).find('.listTxt').html();
        $('#end_select_text').html(listText);
    });

    $('#clusterEndList').click(function(){
        $(this).slideUp(150);
    });

    $('#mouseEnd').mouseleave(function(){
        $('#clusterEndList').slideUp(150);
    });
});

//show cluster func-panel

function clusterPan(clusterPanel){
    var i;
    var x = document.getElementsByClassName("cluster-panel");
    for (i=0;i < x.length; i++){
        x[i].style.display = "none";
    }
    document.getElementById(clusterPanel).style.display="block";
    Hide_InfoPanel();
    if(clusterPanel == "findPath"){
        d3.select("#clusterBtnPath").style("background-color","white");
        d3.select("#textPath").style("font-weight","bold");
        d3.select("#textPath").style("color","black");
        d3.select("#clusterBtnNode").style("background-color","#2196F3");
        d3.select("#textNode").style("font-weight","normal");
        d3.select("#textNode").style("color","white");
    }
    else if(clusterPanel =="generateMore"){
        d3.select("#clusterBtnNode").style("background-color","white");
        d3.select("#textNode").style("font-weight","bold");
        d3.select("#textNode").style("color","black");
        d3.select("#clusterBtnPath").style("background-color","#2196F3");
        d3.select("#textPath").style("font-weight","normal");
        d3.select("#textPath").style("color","white");
    };
};

//change the select of cluster
function ChangeSelectCluster(node){
    Hide_InfoPanel();
    resumeClusterColor();
    var option = d3.select(node).selectAll('option.optionCluster').filter(function(d){return node.value==d3.select(this).attr('value');});
    d3.select(node).style('background-color',option.style('background-color'));
    FOCUSING_CLUSTER = node.value;
};
