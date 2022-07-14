export default `
<div class="field">
    <label class="label" id="mdr-search-label" i18n="mdr-search-label"></label>
    <input class="input" type="text" id="mdr-search-input" autocomplete="off">
</div>
<div class="field">
    <div class="table-container">
        <table class="table is-striped is-fullwidth is-hidden" id="mdr-data-table-itemgroup">
            <thead class="is-fullwidth">
                <tr>
                    <th><abbr title="Frequency">Freq</abbr></th>
                    <th>Name</th>
                    <th>Concept Code</th>
                    <th>Items</th>
                    <th><abbr title="Description">Desc</abbr></th>
                    <th>Lang</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
        <table class="table is-striped is-fullwidth is-hidden" id="mdr-data-table-item">
            <thead class="is-fullwidth">
                <tr>
                    <th><abbr title="Frequency">Freq</abbr></th>
                    <th>Name</th>
                    <th>Concept Code</th>
                    <th>Unit</th>
                    <th>DataType</th>
                    <th><abbr title="Question">Ques</abbr></th>
                    <th><abbr title="Codelist">CL</abbr></th>
                    <th>Lang</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
        <table class="table is-striped is-fullwidth is-hidden" id="mdr-data-table-codelistitem">
            <thead class="is-fullwidth">
                <tr>
                    <th><abbr title="Frequency">Freq</abbr></th>
                    <th>Concept Code</th>
                    <th><abbr title="Coded Value">CV</abbr></th>
                    <th>Decode</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
    </div>
    <div class="table-container is-hidden" id="item-details-table-container"> 
    </div>
</div>`
