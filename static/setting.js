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
var maxlinkdistance=100;
var minlinkdistance=20;
var maxlinkwidth=5;
var minlinkwidth=1;
var maxNodeRadius=20;
var minNodeRadius=5;
var tran = d3.transition()
             .duration(5000)
             .ease(d3.easeLinear);

var HltNodesNumber=20;
var POSITIONFORCE_STRENGTH=0.8;
var N_SearchButton=3;
var Type_distance = 'Fw';
var N_ExploreFunctionpanel=20;
var HltPathColor = '#FF6800';
var NodeColor = '#3498DB';
var EdgeColor = '#aaa';

//add svg
SVG = d3.select('body').append('svg').attr('id',"Mainback").attr('width',w) .attr('height',h);
function SVG_change_size(){
    w=window.innerWidth || document.body.clientWidth;
    h=window.innerHeight || document.body.clientHeight;
    SVG.attr('width',w) .attr('height',h);
    BACKLAYER.attr("width", w).attr("height", h);
};
//add  main canvas
GRAPH = SVG.append("g")
           .attr("id","MainGraph");

BACKLAYER_Zoom = d3.zoom()
                   .scaleExtent([1/4,4])
                   .on("zoom",zoomed);
BACKLAYER = SVG.insert("rect",":first-child")
                  .attr("id","Backlayer")
                  .attr("width", w)
                  .attr("height", h)
                  .call(BACKLAYER_Zoom);

//set nodes and edges and simulation
CLIENT_NODES=[];
CLIENT_NODES_ids=[];
CLIENT_EDGES=[];
//define SIMULATION
SIMULATION = d3.forceSimulation()
               .force("link",d3.forceLink().id(function id(d){return d.wid;}).links(CLIENT_EDGES)) //add spring
               .force("charge", d3.forceManyBody().strength(-100)) //repel each other
               .force("center", d3.forceCenter(w / 2, h / 2)) // force to center
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


// CSS - function-navigation panel

// explore next page
   function pagedown(){
       Handle_ExploreNext_Button();
   };
// explore previous page
   function pageup(){
       Handle_Exploreprevious_Button();
   };


// CSS - search-box control
  function checkTextField(field) {
    document.getElementById("info_panel").style.display = "none";
    if (field.value != '') {
        d3.select('input[name="clear"]').style("visibility","visible");
    }
    else{
        d3.select('input[name="clear"]').style("visibility","hidden");
        document.getElementById("info_panel").style.display = "none";
        document.getElementById("point").style.display = "none";
        document.getElementById("line").style.display = "none";
        document.getElementById("cluster").style.display ="none";
        document.getElementById("func-nav").style.top = "-999px";
    }
  };

var clear_button=d3.select('input[name="clear"]');
    clear_button.on('click', function(){
            document.getElementById("info_panel").style.display = "none";
            document.getElementById("point").style.display = "none";
            document.getElementById("line").style.display = "none";
            document.getElementById("cluster").style.display ="none";
        document.getElementById("keywords").value = "";
        this.style.visibility = "hidden";
    });

// --------------------------------just for testing; please remove on formal version --------------------------------//
  function searchbutton(){
    if(document.getElementById("point").style.display == "none" &&
       document.getElementById("line").style.display == "none" &&
       document.getElementById("cluster").style.display == "none")
       {
        if(document.getElementById("func-nav").style.top == "-999px"){
            document.getElementById("func-nav").style.top = "0px";
        };
    };
    document.getElementById("func-nav").style.display = "block";

  }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// CSS - Global-local switch control
$(document).ready(function(){
    $('#switch-1').click(function(){
        $('.t-global').toggleClass('t-global-toggle');
        $('.t-local').toggleClass('t-local-toggle');
    });
    $('#switch-2').click(function(){
        $('.t-global').toggleClass('t-global-toggle');
        $('.t-local').toggleClass('t-local-toggle');
    });
    $('#switch-3').click(function(){
        $('.t-global').toggleClass('t-global-toggle');
        $('.t-local').toggleClass('t-local-toggle');
    });
});

// selet explore minhops
function change_exploreMinhop(){
    ExploreHops();
};


// show func-nav panel
function show_panel(panelname){
    if (panelname == "line" || panelname == "cluster"){
        document.getElementById("mainSearchBox").style.top = "-999px";
    }

    var i;
    var x = document.getElementsByClassName("func_setting");
    for (i=0;i < x.length; i++){
        x[i].style.display = "none";
    }
    document.getElementById("func-nav").style.top = "-999px";
    document.getElementById(panelname).style.display = "block";
}

// show results panel
function show_info(panelname){
    if (panelname == "point"){
        document.getElementById("info_panel").style.top = "170px";
    }
    else if (panelname == "line"){
        document.getElementById("info_panel").style.top = "200px";
    }
    else if (panelname == "cluster"){
        document.getElementById("info_panel").style.top ="303px";
    };
    document.getElementById("info_panel").style.display = "block";
}

// close line function panel
function closePanel(panelname){
    if(panelname == "line"){
        document.getElementById("info_panel").style.display = "none";
        document.getElementById("line").style.display = "none";
        document.getElementById("mainSearchBox").style.top = "10px";
    }
    else if(panelname == "cluster"){
        document.getElementById("info_panel").style.display = "none";
        document.getElementById("cluster").style.display = "none";
        document.getElementById("mainSearchBox").style.top = "10px";
    };

}

function closeInfoPanel(field){
    document.getElementById("info_panel").style.display = "none";
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
});

//show cluster func-panel
clusterPan("findPath");
function clusterPan(clusterPanel){
    var i;
    var x = document.getElementsByClassName("cluster-panel");
    for (i=0;i < x.length; i++){
        x[i].style.display = "none";
    }
    document.getElementById(clusterPanel).style.display="block";
    document.getElementById("info_panel").style.display = "none";
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
