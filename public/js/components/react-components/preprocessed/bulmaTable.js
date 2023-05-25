var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

export default function BulmaTable(props) {
    var headers = props.headers,
        rows = props.rows;

    return React.createElement(
        'div',
        { className: 'table is-striped is-fullwidth', style: { border: '5px solid var(--link-color)', borderRadius: '5px' } },
        React.createElement(
            'div',
            { className: 'mb-0 is-sticky-header has-background-link has-text-white p-2', style: { boxShadow: '0px 2px var(--link-active-color)' } },
            React.createElement(
                'div',
                { className: 'is-flex is-fullwidth mb-0 is-justify-content-space-between is-flex-direction-row' },
                headers ? headers.map(function (_ref) {
                    var title = _ref.title,
                        width = _ref.width;

                    return React.createElement(
                        'div',
                        { className: 'is-flex-grow-1 has-text-weight-bold ml-1', style: { width: width }, key: title },
                        title
                    );
                }) : ''
            )
        ),
        React.createElement(
            'div',
            { className: 'has-background-link', style: { overflowY: 'auto', maxHeight: '270px' } },
            rows ? rows.map(function (row) {
                var key = row.key,
                    elements = row.elements;

                return React.createElement(
                    'div',
                    { className: 'is-flex mb-0 is-justify-content-space-between is-flex-direction-row m-2 has-background-light p-1', key: 'row_' + key, style: { gap: '5px', border: '3px solid var(----link-light-color)', borderRadius: '3px' } },
                    Object.entries(elements).map(function (_ref2) {
                        var _ref3 = _slicedToArray(_ref2, 2),
                            identifier = _ref3[0],
                            _ref3$ = _ref3[1],
                            element = _ref3$.element,
                            width = _ref3$.width;

                        return React.createElement(
                            'div',
                            { className: 'is-flex-grow-1 is-flex ', style: { width: width }, key: identifier },
                            element
                        );
                    })
                );
            }) : ''
        )
    );
}