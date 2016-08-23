
var Search_Button=d3.select("input[name='search']");

// search button behavior
Search_Button.on("mouseover",function(){
  d3.select(this).style({"background-image": "url('/static/SearchButtonMouseOver.png')"})
});


Search_Button.on("mouseout",function(){
  d3.select(this)
  .style({"background-image": "url('/static/SearchButton.png')"})
});


Search_Button.on('click',function(){
  console.log("click search button");
  d3.json('/texttowid/'+get_inputtext(),function(error,data){
      //change view to all nodes
      console.log("adjust view to the query node");
      //get current local nodes
      var currentnodes = CURRENT_NODESSET(CLIENT_NODES,"wid");
      //get query
      var query = data

      if(_.contains(currentnodes,query)){//existings, explore local
          var subparameters = {'ipt':query,'tp':Type_distance,'minhops':1,'localnodes':currentnodes};
          var parameters = {'N':N_SearchButton,'parameters':subparameters,'generator':'get_Rel_one','start':true};
          var info={'explorelocal':true,'localnodes':null,'parameters':parameters};
          console.log(info);
          d3.json('/explore/'+JSON.stringify(info),function(error,data){
              assert(data.AddNew==false, 'why need to add new nodes when exploring local graph?');
              var highlights={'nodes':[query],'paths':data.paths};
              highlight_nodespaths(highlights);
          });
      }else{
          var subparameters = {'ipt':query,'tp':Type_distance,'minhops':1,'localnodes':null};
          var parameters = {'N':N_SearchButton,'parameters':subparameters,'generator':'get_Rel_one','start':true};
          var info={'explorelocal':false,'localnodes':currentnodes,'parameters':parameters};
          console.log(info);
          d3.json('/explore/'+JSON.stringify(info),function(error,data){
              assert(data.AddNew==true, 'why not add new nodes when queries not in local graph?');
              if(currentnodes.length==0){
                  var bornplace = {x:NaN,y:NaN,vx:NaN,vy:NaN}
              }else{
                  var bornplace = {x:w/2, y:h/2, vx:NaN, vy: NaN};
              };
              SHOW_UPDATE_FORCE(data,bornplace);
              var highlights={'nodes':[query],'paths':data.paths};
              highlight_nodespaths(highlights);
          });
      };

  });
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
      d3.json('/wordrank/'+d.wid,function(error,data){
          console.log(JSON.stringify(data));
          highlight_wordrank(data);
          Backlayer_clickon();
      });
   });
};

// Backlayer background click on
function Backlayer_clickon(){
    BACKLAYER.on('click',function(){
        console.log("click Backlayer");
        RedoBack();
    });
};



