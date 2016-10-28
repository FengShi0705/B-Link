$(document).ready(function(){

    //////////// Check Null question title from FB3 ////////////
    if ($('.checkNullTitle').is(':empty')){
        console.log('find null span')
        alert('find null span')
        $(this).parentsUntil('.rating-layout')
            .hide();
        console.log('hide done')
        alert('hide done')
    };


    ///////////  Rating system design  ////////////
    $('circle[stroke="#8600b3"]').click(function(){
        var inputName = $(this).attr("class");
        var value = $(this).attr('value');
        $('input[name='+ inputName +']').attr('value',value);
        var inputValue = $('input[name='+inputName+']').attr('value');
        $(this).siblings().attr('fill','white');
        $(this).attr('fill','#8600b3');
        console.log(value)

    });
    $('circle[stroke="#cccccc"]').click(function(){
        var inputName = $(this).attr("class");
        var value = $(this).attr('value');
        $('input[name='+ inputName +']').attr('value',value);
        var inputValue = $('input[name='+inputName+']').attr('value');
        $(this).siblings().attr('fill','white');
        $(this).attr('fill','#cccccc');

    });
    $('circle[stroke="#4CAF50"]').click(function(){
        var inputName = $(this).attr("class");
        var value = $(this).attr('value');
        $('input[name='+ inputName +']').attr('value',value);
        var inputValue = $('input[name='+inputName+']').attr('value');
        $(this).siblings().attr('fill','white');
        $(this).attr('fill','#4CAF50');

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

    ////////////  Required form submission CHECK /////////////////
    $('form').submit(function(){

        var required = $('[required]');
        var error = false;

        for(var i = 0; i <= (required.length - 1);i++)
        {
            if(required[i].value == '') // tests that each required value does not equal blank, you could put in more stringent checks here if you wish.
            {
                required[i].style.backgroundColor = 'rgb(255,155,155)';
                error = true; // if any inputs fail validation then the error variable will be set to true;
            }
            else if(required[i].type == 'radio')
            {   group = required[i].name
                if ($('input[name='+group+']').is(':checked')){
                }
                else{
                    error = true;
                    required[i].style.backgroundColor = 'rgb(255,155,155)';
                }
            }
        };

        if(error) // if error is true;
        {
            alert('Please answer the required questions, thanks !')
            return false;  // stop the form from being submitted.
        };
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


