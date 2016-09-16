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

    //update previous focus
    FOCUSING_NODE = query;

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
            d3.select('input#keywords').data([data]);
            updateGraph_searchButton(data,zh_nodes);
        }else{
            alert('Can not match your input concepts');
        };
    });
    Hide_InfoPanel();
};

// handle search button of path
function Handle_pathSearchbutton(searchbutton_id){
     d3.json('/texttowid/'+get_inputtext(searchbutton_id),function(error,data){
         if (data){
             var node1=data;
             var selector1='input#'+searchbutton_id;
             d3.select(selector1).data([node1]);
             var theother_id= _.difference( ['pathstart_textinput','pathend_textinput'] , [searchbutton_id])[0];

             d3.json('/texttowid/'+get_inputtext(theother_id),function(error,data){
                 if(data){
                     var node2=data;
                     var selector2='input#'+theother_id;
                     d3.select(selector2).data([node2]);

                     var zh_nodes=[node1,node2];
                     updateGraph_searchButton(node1,zh_nodes);
                 }else{
                     var zh_nodes=[node1];
                     updateGraph_searchButton(node1,zh_nodes);
                 };
             });
         }else{
             alert('Can not match your input concepts');
         };
     });
     Hide_InfoPanel();
};

//Explore show results
function Explore_showResult(){
        var query = d3.select('input#keywords').data()[0];
        var label = NODE_IdToObj(query).label;
        var minhops = get_minhops('minhop_point');
        Explore_Nearby(check_explore_LG('switch-1'),true,minhops,N_SearchButton,query,query);
        //update input search box
        d3.select('input[name="keywords"]').node().value = label;
        //onclick next and previous
        d3.select('#info_panel #pageup').on('click', Explore_Previous);
        d3.select('#info_panel #pagedown').on('click', Explore_Next);
};

//Explore next handler OK
function Explore_Next(){
    var query = d3.select('input#keywords').data()[0];
    var minhops = get_minhops('minhop_point');
    Explore_Nearby(check_explore_LG('switch-1'),false,minhops,N_SearchButton,query,query);
};

//Explore previous handler OK
function Explore_Previous(){
    var query = d3.select('input#keywords').data()[0];
    var minhops = get_minhops('minhop_point');
    Explore_Nearby(check_explore_LG('switch-1'), false, minhops, -N_SearchButton, query, query);
};

// Findpath show results
function FindPath_showResult(){
      var node1 = d3.select('input#pathstart_textinput').data()[0];
      var node2 = d3.select('input#pathend_textinput').data()[0];
      var label1 = NODE_IdToObj(node1).label;
      var label2 = NODE_IdToObj(node2).label;

      var minhops = get_minhops('minhop_line');
      findPaths_betweenNodes(check_explore_LG('switch-2'), true, minhops, N_SearchButton, node1, node2);
      // update search box of start and end point
      d3.select('input#pathstart_textinput').node().value = label1;
      d3.select('input#pathend_textinput').node().value = label2;
      // onclick next and previous
      d3.select('#info_panel #pageup').on('click', FindPath_previous);
      d3.select('#info_panel #pagedown').on('click', FindPath_next);
};

//find path next
function FindPath_next(){
    var node1 = d3.select('input#pathstart_textinput').data()[0];
    var node2 = d3.select('input#pathend_textinput').data()[0];
    var minhops = get_minhops('minhop_line');
    findPaths_betweenNodes(check_explore_LG('switch-2'), false, minhops, N_SearchButton, node1, node2);
};
//find path previous
function FindPath_previous(){
    var node1 = d3.select('input#pathstart_textinput').data()[0];
    var node2 = d3.select('input#pathend_textinput').data()[0];
    var minhops = get_minhops('minhop_line');
    findPaths_betweenNodes(check_explore_LG('switch-2'), false, minhops, -N_SearchButton, node1, node2);
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
          d3.selectAll('input#keywords,input#pathstart_textinput,input#pathend_textinput').each(function(d){this.blur();});
      });

      GRAPH.selectAll('.gnode').on('click',function(d){
          var clicked_data = d;
          var preNode =  FOCUSING_NODE;
          FOCUSING_NODE = d.wid;

          if( d3.select('#line').style('display')=='block' ){
              if(preNode == clicked_data.wid){
                  //highlight
                  var highlights = {'nodes':[clicked_data.wid],'paths':[],'paths1':[]};
                  highlight_nodespaths(highlights);
                  //update searchbox
                  d3.select('input#pathstart_textinput').node().value = clicked_data.label;
                  d3.select('input#pathend_textinput').node().value='';
                  //attach data
                  d3.select('input#pathstart_textinput').data([clicked_data.wid]);
                  d3.select('input#pathend_textinput').data([null]);
              }else{
                  //highlight
                  var highlights = {'nodes':[clicked_data.wid,preNode],'paths':[],'paths1':[]};
                  highlight_nodespaths(highlights);
                  //update search box
                  d3.selectAll('input#pathstart_textinput,input#pathend_textinput')
                    .filter(function(d){return d!=preNode;})
                    .data([clicked_data.wid]) //data attach
                    .each(function(d){this.value = clicked_data.label;});

              };

          }else{
              // highlight the clicked node
              var highlights = {'nodes':[d.wid],'paths':[],'paths1':[]};
              highlight_nodespaths(highlights);
              //update inputbox
              d3.select('input[name="keywords"]').node().value = d.label;
              //attach data
              d3.select('input[name="keywords"]').data([d.wid]);
          };
   });
};

// Backlayer background click on
function Backlayer_clickon(){
    BACKLAYER.on('click',function(){
        console.log("click Backlayer");
        RedoBack();
    });
};



