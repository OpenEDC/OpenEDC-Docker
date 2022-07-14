import * as requestHelper from "./requesthelper.js"
import * as htmlHelper from "./htmlhelper.js"

export async function processConceptsData(data) {
    
    await Promise.all(data.content
    .flatMap(d => d.concepts)
    .map(c => c.concept)
    .filter((v,i,s) => s.indexOf(v) === i)
    .map(c => requestHelper.getUMLSData(c).then(t => htmlHelper.umlsMap.set(t.CUI, t.STR[0]))));
    let processedData = [];
    data.content.forEach(c => processedData.push(structureConcept(c, htmlHelper.umlsMap)));
    return processedData;
}

export function structureConcept(data, umlsMap) {
    return { 
        name: data.value,
        code: data.concepts.map(a => {return {concept: a.concept, name: umlsMap.get(a.concept)}}),
        occurrences: data.occurrences,
        data: data
    }
}