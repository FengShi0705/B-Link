$(document).ready(function(){
    ///////////  Rating system design  ////////////
    $('circle[stroke="#8600b3"]').click(function(){
        var inputName = $(this).attr("class");
        var value = $(this).attr('value');
        $('input[name='+ inputName +']').attr('value',value);
        var inputValue = $('input[name='+inputName+']').attr('value');
        $(this).siblings().attr('fill','white');
        $(this).attr('fill','#8600b3');
        alert('inputValue is '+ inputValue +'; value is '+ value +' !' )
    });
    $('circle[stroke="#e6e6e6"]').click(function(){
        var inputName = $(this).attr("class");
        var value = $(this).attr('value');
        $('input[name='+ inputName +']').attr('value',value);
        var inputValue = $('input[name='+inputName+']').attr('value');
        $(this).siblings().attr('fill','white');
        $(this).attr('fill','#e6e6e6');
        alert('inputValue is '+ inputValue +'; value is '+ value +' !' )
    });
    $('circle[stroke="#4CAF50"]').click(function(){
        var inputName = $(this).attr("class");
        var value = $(this).attr('value');
        $('input[name='+ inputName +']').attr('value',value);
        var inputValue = $('input[name='+inputName+']').attr('value');
        $(this).siblings().attr('fill','white');
        $(this).attr('fill','#4CAF50');
        alert('inputValue is '+ inputValue +'; value is '+ value +' !' )
    });

    ////////////  OPTION 'OTHER' DESIGN /////////////////
    $('input[name$="HCI3"]').click(function(){
        if($('#HCI3_other').is(':checked')){
            $('#HCI3_input').css('display','block');
        }
        else{
            $('#HCI3_input').css('display','none');
        }
    });

    $('input[name$="FE5"]').click(function(){
        if($('input[name$="FE5"]').is(':checked')){
            $('#FE5reason').show();
        }
        else{
            $('#FE5reason').hide();
        }
    });

});


/*function otherJob(){

    var fb_job = document.getElementById("job");
    var fb_job_option = fb_job.options[fb_job.selectedIndex].value;

    if (fb_job_option == "other"){
        document.getElementById("job_other").style.display = "block";
    }
    else
        document.getElementById("job_other").style.display = "none";
}

function otherSubj(){

    var fb_subj = document.getElementById("subject");
    var fb_subj_option = fb_subj.options[fb_subj.selectedIndex].value;

    if (fb_subj_option == "other"){
        document.getElementById("subject_other").style.display = "block";
    }
    else
        document.getElementById("subject_other").style.display = "none";
}
*/


