export function formatContext(context) {
    if((/UMLS CUI \[\d*,\d*\]/g).test(context))
        return context.replace(/(UMLS CUI \[\d*,)\d*(\])/g, "$1x$2");
    return context;
}