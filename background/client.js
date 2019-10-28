//Listener
window.onload = function(){
    getIncidents();
    document.getElementById("refresh").addEventListener("click", getIncidents);
    document.getElementById("search").addEventListener("click", getInput);

}

//PD REST API WRAPPER  
function PDAPI(version) {
    let self = this;
    self.userAgent = "pd-chrome-notifier-" + chrome.app.getDetails().version;

    //Verify User
    this.prepareRequest = function prepareRequest(method, url) {
        let apiReq = new XMLHttpRequest();
        apiReq.open(method, url, true);
        apiReq.setRequestHeader("X-Requested-With", this.userAgent);
        apiReq.setRequestHeader("X-PagerDuty-Api-Local", 1);
        apiReq.setRequestHeader("Accept", "application/vnd.pagerduty+json;version=" + version);
        //Hard coded token -> Only one account is authenicated with this extension
        //Future improvement is to add OAuth and authenicate other accounts 
        apiReq.setRequestHeader("Authorization", "Token token=_DdHM1a1g8GX4qQNrGeX");
        return apiReq;
    }

    // Perform a GET request, and trigger the callback with the result.
    this.GET = function GET(url, callback, error_callback = null) {
        let reqOp = self.prepareRequest("GET", url);
        reqOp.onreadystatechange = function() {
            if (reqOp.readyState == 4)
            {
                try {
                    callback(JSON.parse(reqOp.responseText));
                }
                catch(e) {
                    if (error_callback != null) { error_callback(reqOp.status, reqOp.responseText); }
                }
            }
        };
        reqOp.send();
    }
}

//API Instance
let self = this;
self.pdapi = new PDAPI(2);
let pdURL = 'https://api.pagerduty.com/incidents';


let statusType = new Map([
    ['triggered', '<img src="../img/icon-triggered.png" style="width:20px;height:20px;">'],
    ['acknowledged', '<img src="../img/icon-acknowledge.png" style="width:30px;height:30px;">'],
    ['resolved', '<img src="../img/icon-resolve.png" style="width:30px;height:30px;">']
])

function dateFormat(date) {
    let year = date.slice(0,10);
    let time = date.slice(11,16);
    return(year + ' ' + time);
}


function getInput() {
    let incident_number = document.getElementById("input").value;

    if (incident_number !== undefined) {

        //GET Call
        self.pdapi.GET(pdURL + '/'+ incident_number, function(data) {
        
        //Error Check 
        if (data.error !== undefined || incident_number <= 0) {
            console.log(data.error);
            //Call listIncidents to repopulate table with recent entries
            getIncidents();

            //Update HTML Text
            document.getElementById("input").value="Enter valid number";
        }
        
        else {
            //Update HTML Text with new data
            let title = document.querySelector('#title');
            title.innerHTML = `Search Result`
            let div = document.createElement('div');
            let oldDiv = document.querySelector('#incidentNumber');
            oldDiv.innerHTML =
            `<div class="row title-row">
                <div class="col">Incident #</div>
                <div class="col">Title</div>
                <div class="col">Date</div>
                <div class="col">Status</div>
            </div>`;
            div.innerHTML = `
            <a href=${data.incident.html_url} target="_blank" color="black">
            <div class="row table-row">
                <div class="col">${data.incident.incident_number}</div>
                <div class="col">${data.incident.title}</div>
                <div class="col">${dateFormat(data.incident.created_at)}</div>
                <div class="col">${statusType.get(data.incident.status)}</div>
            </div>
            </a>
            `;
            
        document.getElementById('incidentNumber').appendChild(div);
        }
        })
    }
}

function getIncidents() {

    //Update HTML Text 
    document.getElementById("input").value="";
    let title = document.querySelector('#title');
    title.innerHTML = `Recent Incidents`

    //GET Call
    self.pdapi.GET(pdURL, function(data) {
        //Error Check
        if(data.error !== undefined) {
            console.error("PagerDuty API returned an error while getting the all incidents.", {
                api_url: pdURL,
                error_returned: data.error
                });
            return;
        }

        if (data.incidents.length === 0) {
            //Update HTML Text to say no incidents found
            let div = document.createElement('div');
            div.setAttribute('class', 'row');
            div.innerHTML = `
            <div class="row">
                <div class="col">No incidents recorded</div>
            </div>
            `;
            document.getElementById('incidentNumber').appendChild(div);
        }

        if (data.incidents.length > 0) {
            let oldDiv = document.querySelector('#incidentNumber');
            oldDiv.innerHTML = `
            <div class="row title-row">
                <div class="col">Incident #</div>
                <div class="col">Title</div>
                <div class="col">Date</div>
                <div class="col">Status</div>
            </div>
            `;

            //Lower bound value -> As of right now only the 5 most recent incident is shown
            //Future Improvement: Sort incidents by a filter and paginate the number of incidents dynamically
            let bound = data.incidents.length - 5 < 0 ? 0 : data.incidents.length - 5;

            for (let i = data.incidents.length - 1; i >= bound; i--) {
                //Update HTML Text with new data
                let div = document.createElement('div');
                div.innerHTML = `
                <a href=${data.incidents[i].html_url} target="_blank">
                <div class="row table-row">
                    <div class="col">${data.incidents[i].incident_number}</div>
                    <div class="col">${data.incidents[i].title}</div>
                    <div class="col">${dateFormat(data.incidents[i].created_at)}</div>
                    <div class="col">${statusType.get(data.incidents[i].status)}</div>
                </div>
                </a>
                `;
                document.getElementById('incidentNumber').appendChild(div);
            }
        }
    })
}
