//update graph for search button
//query is the node to be searched or added
// zh_nodes is the list of nodes to be zoomed and highlighted as end nodes
function updateGraph_searchButton(query,zh_nodes){
    var currentnodes = CURRENT_NODESSET(CLIENT_NODES,"wid");
    if(_.contains(currentnodes,query)){
        var highlights = {'nodes':zh_nodes,'paths':[],'paths1':[]};
        highlight_nodespaths(highlights);
        ZoomToNodes(zh_nodes);
    }else{
        var info={'currentnodes':currentnodes,'query':query};
        d3.json('/searchbutton/'+JSON.stringify(info),function(error,data){
            if(data.bornnode){
                var bornnode = CLIENT_NODES.filter(function(obj){return obj["wid"]==data.bornnode;})[0];
                var bornplace = {x:bornnode.x, y:bornnode.y, vx:bornnode.vx, vy: bornnode.vy};
            }else{var bornplace = {x:w/2, y:h/2, vx:NaN, vy: NaN};};
            SHOW_UPDATE_FORCE(data,bornplace);
            node_left_click_on();
            var highlights = {'nodes':zh_nodes,'paths':[],'paths1':[]};
            highlight_nodespaths(highlights);
            ZoomToNodes(zh_nodes);
        });
    };

    if(document.getElementById("point").style.display == "none" &&
      document.getElementById("line").style.display == "none" &&
      document.getElementById("cluster").style.display == "none")
    {
      if(document.getElementById("func-nav").style.top == "-999px"){
          document.getElementById("func-nav").style.top = "0px";
      };
    };
     document.getElementById("func-nav").style.display = "block";

};


// Handle search button
function Handle_Search_Button(searchbutton_id){
    d3.json('/texttowid/'+get_inputtext(searchbutton_id),function(error,data){
        if (data){
            var zh_nodes=[data];
            updateGraph_searchButton(data,zh_nodes);
        };
    });
    Hide_InfoPanel();
};

// handle search button of path
function Handle_pathSearchbutton(searchbutton_id){
     d3.json('/texttowid/'+get_inputtext(searchbutton_id),function(error,data){
         if (data){
             var node1=data;
             var theother_id= _.difference( ['pathstart_textinput','pathend_textinput'] , [searchbutton_id])[0];
             d3.json('/texttowid/'+get_inputtext(theother_id),function(error,data){
                 if(data){
                     var node2=data;
                     var zh_nodes=[node1,node2];
                     updateGraph_searchButton(node1,zh_nodes);
                 }else{
                     var zh_nodes=[node1];
                     updateGraph_searchButton(node1,zh_nodes);
                 };
             });
         };
     });
     Hide_InfoPanel();
};

//Explore show results
function Explore_showRessult(){
        var hltNode = d3.select('circle.hltA').data()[0];
        var query = hltNode.wid;
        var label = hltNode.label;
        var minhops = get_minhops('minhop_point');
        Explore_Nearby(check_explore_LG('switch-1'),true,minhops,N_SearchButton,query,query);
        d3.select('input[name="keywords"]').node().value = label;
};

//Explore next handler OK
function Explore_Next(){
    var query = d3.select('circle.hltA').data()[0].wid;
    var minhops = get_minhops('minhop_point');
    Explore_Nearby(check_explore_LG('switch-1'),false,minhops,N_SearchButton,query,query);
};

//Explore previous handler OK
function Explore_Previous(){
    var query = d3.select('circle.hltA').data()[0].wid;
    var minhops = get_minhops('minhop_point');
    Explore_Nearby(check_explore_LG('switch-1'), false, minhops, -N_SearchButton, query, query);
};


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



