class PlotModal extends HTMLElement {
    setUrl(url) { this.url = url; }
    setParameters(parameters) { this.parameters = parameters; }
    setName(name) { this.name = name; }
    setPath(path) { this.path = path; }
    setMetaData(metadata) { this.metadata = metadata; }
    setClinicalData(clinicalData) { this.clinicalData = clinicalData; }
    setSubjectFormData(subjectFormData) { this.subjectFormData = subjectFormData; }
    setMethod(method) { this.method = method; }
    setSubject(subject) { this.subject = subject; }


    //src="data:application/pdf;base64,${this.data}"
    connectedCallback() {
        this.innerHTML = `
        <div class="modal is-active" style="user-select: text;">
            <div class="modal-background"></div>
            <div class="modal-card is-fit-content">
                <header class="modal-card-head">
                    <p class="modal-card-title">${this.name}</p>
                    <button class="delete" aria-label="close"></button>
                </header>
                <section class="modal-card-body">
                    <div id="copy_container" class="is-flex is-justify-content-center">
                    </div>
                    <button class="button is-link is-hidden" aria-label="close" id="copy_button">Copy to Clipboard</button>
                </section>
            </div>
        </div>`;
        this.querySelector('.delete').onclick = () => this.remove();
        this.querySelector(".modal-background").onclick = () => this.remove();
        this.querySelector('#copy_button').onclick = this.copyToClipboard;
        this.formAndSendUrl((response) => {
            const contentType = response.headers.get("content-type");
            if(contentType.includes('text/html')) {
                response.text().then(text => {
                    this.querySelector('#copy_container').innerHTML = text;
                    this.querySelector('#copy_button').show();
                    return;
                })
            }
            if(contentType.includes("application/octet-stream")) {
                response.blob().then(blob => {
                    var outputImg = document.createElement('img');
                    outputImg.src = URL.createObjectURL(blob)
                    this.querySelector('#copy_container').append(outputImg);
                })
            }
            if(contentType.includes('image')){
                response.arrayBuffer().then(buffer => {
                    var outputImg = document.createElement('img');
                    let blob = new Blob([buffer], {type : contentType});
                    outputImg.src = URL.createObjectURL(blob)
                    this.querySelector('#copy_container').append(outputImg)
                }); 
            }
        })
    }

    formAndSendUrl(responseCallback) {
        let finalParameters = new Map(this.parameters);
        finalParameters.forEach((value, key) => {
            finalParameters.set(key, this.replaceParameter(value))
        });
        const method = this.method.toUpperCase();
        switch(method) {
            case 'GET': 
            finalParameters.forEach((value, key) => {
                    this.url.searchParams.append(key, value);
                })
                fetch(this.url).then(response => responseCallback(response));
                break;
            case 'POST': 
            case 'PUT': 
                let formData = new FormData();
                finalParameters.forEach((value, key) => {
                   if (typeof(value) == "object" && (value instanceof XMLDocument ||value instanceof Element) ) {
                       let serializer = new XMLSerializer();
                       formData.append(key, serializer.serializeToString(value));
                    }
                    else {
                       formData.append(key, value);
                    }
                });
                fetch(this.url, {method, body: formData}).then(response => responseCallback(response));
                break;
        } 
    }

    replaceParameter(value) {
        if(!value.startsWith("$")) return value;
        value = value.substring(1);
        switch(value) {
            case "value":
                let values = [...Object.values(this.subjectFormData)].filter(data => data.itemGroupOID == this.path.itemGroupOID && data.itemOID == this.path.itemOID);
                if(values && values.length > 0) return values[0].value
                return ''; 
            case "studyEventRepeatKey":
            case "studyEventOID":
            case "formOID":
            case "itemGroupOID":
            case "itemOID":
                return this.path[value];
            case "metadata":
                 return this.metadata;
            case "clinicaldata":
                return this.subject;
        }

    }

    copyToClipboard() {
        let selection = window.getSelection();
        let container = document.querySelector('#copy_container');
        if (selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
        
        const range = document.createRange();
        range.selectNode(container);
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeAllRanges();
      }
}

window.customElements.define("plot-modal", PlotModal);
