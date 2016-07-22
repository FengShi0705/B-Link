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


//add  main canvas
SVG = d3.select("svg#Mainback")
         .insert("svg",":first-child")
         .attr("id","maincanvas");
BACKLAYER = SVG.append("rect")
               .attr("id","Backlayer")
               .attr("width", w)
               .attr("height", h);

//nodes and edges
NODES=[];
EDGES=[];