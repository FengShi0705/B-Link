
var Search_Button=d3.select("input[name='search']");

// search button behavior
Search_Button.on("mouseover",function(){
  d3.select(this).style({"background-image": "url('/static/SearchButtonMouseOver.png')"})
});


Search_Button.on("mouseout",function(){
  d3.select(this)
  .style({"background-image": "url('/static/SearchButton.png')"})
});

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
   d3.select("#maincanvas").selectAll('.gnode').on('contextmenu',function(d){
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
   d3.select("#maincanvas").selectAll('.gnode').on('click',function(d){
      // highlight the clicked node
      var highlights = {'nodes':[d.wid],'paths':[]};
      highlight_nodespaths(highlights);
      //update inputbox
      d3.select('input[name="keywords"]').node().value = d.label;
   });
};

// Backlayer background click on
function Backlayer_clickon(){
    BACKLAYER.on('click',function(){
        console.log("click Backlayer");
        RedoBack();
    });
};



