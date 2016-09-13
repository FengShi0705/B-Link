// Handle search button
function Handle_Search_Button(){
    d3.json('/texttowid/'+get_inputtext(),function(error,data){
        if (data){
            var currentnodes = CURRENT_NODESSET(CLIENT_NODES,"wid");
            var query = data;
            if(_.contains(currentnodes,query)){
                var highlights = {'nodes':[query],'paths':[],'paths1':[]};
                highlight_nodespaths(highlights);
                ZoomToNodes([query]);
            }else{
                var info={'currentnodes':currentnodes,'query':query};
                d3.json('/searchbutton/'+JSON.stringify(info),function(error,data){
                    if(data.bornnode){
                        var bornnode = CLIENT_NODES.filter(function(obj){return obj["wid"]==data.bornnode;})[0];
                        var bornplace = {x:bornnode.x, y:bornnode.y, vx:bornnode.vx, vy: bornnode.vy};
                    }else{var bornplace = {x:w/2, y:h/2, vx:NaN, vy: NaN};};
                    SHOW_UPDATE_FORCE(data,bornplace);
                    node_left_click_on();
                    var highlights = {'nodes':[query],'paths':data.paths,'paths1':[]};
                    highlight_nodespaths(highlights);
                    ZoomToNodes([query]);
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
    });
};

//Explore show results
function Explore_showRessult(){
    d3.json('/texttowid/'+get_inputtext(),function(error,data){
        var query = data;
        Explore_Nearby(check_explore_LG(),true,N_SearchButton,query,query);
    });
};

//Explore next handler OK
function Explore_Next(){
    var query = d3.select('circle.hltA').data()[0].wid;
    Explore_Nearby(check_explore_LG(),false,N_SearchButton,query,query);
};

//Explore previous handler OK
function Explore_Previous(){
    var query = d3.select('circle.hltA').data()[0].wid;
    Explore_Nearby(check_explore_LG(),false,-N_SearchButton,query,query);
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



