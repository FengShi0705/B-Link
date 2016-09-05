
var Search_Button=d3.select("input[name='search']");

//Search button click
Search_Button.on('click', Handle_Search_Button);

//input box enter
d3.select("input[name='keywords']").on('keydown',function(){
  if (d3.event.keyCode==13){
      Handle_Search_Button();
  };
});


// node click behavior
function node_right_click_on(){
      GRAPH.selectAll('.gnode').on('contextmenu',function(d){
      d3.event.preventDefault();
      console.log("click node");
      console.log(d.label);
      d3.json('/neighbor_level/'+d.wid,function(error,data){
          console.log(JSON.stringify(data));
          circle_layout_neighbor(data);
          Backlayer_clickon();
      });
   });
};

// node left click behavior
function node_left_click_on(){
      GRAPH.selectAll('.gnode').on('mouseover',function(){
          d3.select('input[name="keywords"]').node().blur();
      });

      GRAPH.selectAll('.gnode').on('click',function(d){
      // highlight the clicked node
      var highlights = {'nodes':[d.wid],'paths':[],'paths1':[]};
      highlight_nodespaths(highlights);
      //update inputbox
      d3.select('input[name="keywords"]').node().value = d.label;
      // hide explore panel
      d3.select('#left-panel').style('visibility', "hidden");
   });
};

// Backlayer background click on
function Backlayer_clickon(){
    BACKLAYER.on('click',function(){
        console.log("click Backlayer");
        RedoBack();
    });
};



