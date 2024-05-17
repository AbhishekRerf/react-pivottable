import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';

// helper function for setting row/col-span in pivotTableRenderer
const spanSize = function(arr, i, j) {
  let x;
  if (i !== 0) {
    let asc, end;
    let noDraw = true;
    for (
      x = 0, end = j, asc = end >= 0;
      asc ? x <= end : x >= end;
      asc ? x++ : x--
    ) {
      if (arr[i - 1][x] !== arr[i][x]) {
        noDraw = false;
      }
    }
    if (noDraw) {
      return -1;
    }
  }
  let len = 0;
  while (i + len < arr.length) {
    let asc1, end1;
    let stop = false;
    for (
      x = 0, end1 = j, asc1 = end1 >= 0;
      asc1 ? x <= end1 : x >= end1;
      asc1 ? x++ : x--
    ) {
      if (arr[i][x] !== arr[i + len][x]) {
        stop = true;
      }
    }
    if (stop) {
      break;
    }
    len++;
  }
  return len;
};

function redColorScaleGenerator(values) {
  const min = Math.min.apply(Math, values);
  const max = Math.max.apply(Math, values);
  return x => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round((255 * (x - min)) / (max - min));
    return {backgroundColor: `rgb(255,${nonRed},${nonRed})`};
  };
}

function makeRenderer(opts = {}) {
  class TableRenderer extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        sortColumn: null,
        sortOrder: 'asc', // Initial sort order
        sortedData: [],
      };
    }
  


    render() {
      const { sortColumn, sortOrder,sortedData } = this.state;
      let pivotData;
      if(this.props.data.length>0 && sortedData.length>0){
        const updatedProps = Object.assign({}, this.props, { data: sortedData });
         pivotData = new PivotData(updatedProps);
      }
      else{
      pivotData = new PivotData(this.props);
      }

      console.log("pivotData")
      console.log(pivotData)
      const colAttrs = pivotData.props.cols;
      const rowAttrs = pivotData.props.rows;
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      const grandTotalAggregator = pivotData.getAggregator([], []);
      let oddRowColor= pivotData.props.options.ODD_ROW_COLOR;
      let headerBgColor= pivotData.props.options.HEADER_BG_COLOR;
      let evenRowColor= pivotData.props.options.EVEN_ROW_COLOR;
      let headerTextColor= pivotData.props.options.HEADER_TEXT_COLOR;
      let borderStyle= pivotData.props.options.BORDER_STYLE;
      let banded= pivotData.props.options.BANDED;
      let bandedRow= pivotData.props.options.BANDED_ROW;
      let bandedColumn= pivotData.props.options.BANDED_COL;

      let valueCellColors = () => {};
      let rowTotalColors = () => {};
      let colTotalColors = () => {};

      
      if (opts.heatmapMode) {
        const colorScaleGenerator = this.props.tableColorScaleGenerator;
        const rowTotalValues = colKeys.map(x =>
          pivotData.getAggregator([], x).value()
        );
        rowTotalColors = colorScaleGenerator(rowTotalValues);
        const colTotalValues = rowKeys.map(x =>
          pivotData.getAggregator(x, []).value()
        );
        colTotalColors = colorScaleGenerator(colTotalValues);

        if (opts.heatmapMode === 'full') {
          const allValues = [];
          rowKeys.map(r =>
            colKeys.map(c =>
              allValues.push(pivotData.getAggregator(r, c).value())
            )
          );
          const colorScale = colorScaleGenerator(allValues);
          valueCellColors = (r, c, v) => colorScale(v);
        } else if (opts.heatmapMode === 'row') {
          const rowColorScales = {};
          rowKeys.map(r => {
            const rowValues = colKeys.map(x =>
              pivotData.getAggregator(r, x).value()
            );
            rowColorScales[r] = colorScaleGenerator(rowValues);
          });
          valueCellColors = (r, c, v) => rowColorScales[r](v);
        } else if (opts.heatmapMode === 'col') {
          const colColorScales = {};
          colKeys.map(c => {
            const colValues = rowKeys.map(x =>
              pivotData.getAggregator(x, c).value()
            );
            colColorScales[c] = colorScaleGenerator(colValues);
          });
          valueCellColors = (r, c, v) => colColorScales[c](v);
        }
      }

      const getClickHandler =
        this.props.tableOptions && this.props.tableOptions.clickCallback
          ? (value, rowValues, colValues) => {
              const filters = {};
              for (const i of Object.keys(colAttrs || {})) {
                const attr = colAttrs[i];
                if (colValues[i] !== null) {
                  filters[attr] = colValues[i];
                }
              }
              for (const i of Object.keys(rowAttrs || {})) {
                const attr = rowAttrs[i];
                if (rowValues[i] !== null) {
                  filters[attr] = rowValues[i];
                }
              }
              return e =>
                this.props.tableOptions.clickCallback(
                  e,
                  value,
                  filters,
                  pivotData
                );
            }
          : null;

          const handleSort = (column) => {
            const { sortColumn, sortOrder } = this.state;
            let newSortOrder = 'asc';
          
            // Toggle sort order if the same column is clicked
            if (sortColumn === column && sortOrder === 'asc') {
              newSortOrder = 'desc';
            }
          
            const sortedData = [...pivotData.props.data].sort((a, b) => {
              if (a[column] < b[column]) return newSortOrder === 'asc' ? -1 : 1;
              if (a[column] > b[column]) return newSortOrder === 'asc' ? 1 : -1;
              return 0;
            });
          
            // Update state with sorted data and column
            this.setState({
              sortColumn: column,
              sortOrder: newSortOrder,
              sortedData: sortedData,
            });
          };

      return (
        <table className="pvtTable">
          <thead>
            {colAttrs.map(function(c, j) {
              return (
                <tr key={`colAttr${j}`}>
                  {j === 0 && rowAttrs.length !== 0 && (
                    <th style={{ backgroundColor: headerBgColor,border:"1px solid #fff",color:`${headerTextColor}` }} colSpan={rowAttrs.length} rowSpan={colAttrs.length} />
                  )}
                  <th  onClick={() => handleSort(c)} className="pvtAxisLabel" style={{ backgroundColor: headerBgColor,border:"1px solid #fff",color:`${headerTextColor}` }}>{c}
                  {sortColumn === c && (
                  <span style={{ marginLeft: '0.5em' }}>
                    {sortOrder === 'asc' ? '▲' : '▼'} {/* Arrow icon */}
                  </span>
                )}
                </th>
                  {colKeys.map(function(colKey, i) {
                    const x = spanSize(colKeys, i, j);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        className="pvtColLabel"
                        key={`colKey${i}`}
                        colSpan={x}
                        rowSpan={
                          j === colAttrs.length - 1 && rowAttrs.length !== 0
                            ? 2
                            : 1
                        }
                        style={{ backgroundColor: headerBgColor,border:"1px solid #fff",color:`${headerTextColor}` }}
                      >
                        {colKey[j]}
                      </th>
                    );
                  })}

                  {j === 0 && (
                    <th
                      style={{ backgroundColor: headerBgColor,border:"1px solid #fff",color:`${headerTextColor}` }}
                      className="pvtTotalLabel"
                      rowSpan={
                        colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                      }
                    >
                      Totals
                    </th>
                  )}
                </tr>
              );
            })}

            {rowAttrs.length !== 0 && (
              <tr>
                {rowAttrs.map(function(r, i) {
                  return (
                    <th className="pvtAxisLabel" onClick={() => handleSort(r)} style={{ backgroundColor: headerBgColor,border:"1px solid #fff",color:`${headerTextColor}` }} key={`rowAttr${i}`}>
                      {r}
                      {sortColumn === r && (
                  <span style={{ marginLeft: '0.5em' }}>
                    {sortOrder === 'asc' ? '▲' : '▼'} {/* Arrow icon */}
                  </span>
                )}
                    </th>
                  );
                })}
                <th className="pvtTotalLabel" style={{ backgroundColor: headerBgColor,border:"1px solid #fff",color:`${headerTextColor}` }}>
                  {colAttrs.length === 0 ? 'Totals' : null}
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {rowKeys.map(function(rowKey, i) {
              const totalAggregator = pivotData.getAggregator(rowKey, []);
              return (
                <tr role='row' className={`bandedNo${i}`} key={`rowKeyRow${i}`}>
                  {rowKey.map(function(txt, j) {
                    const x = spanSize(rowKeys, i, j);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        key={`rowKeyLabel${i}-${j}`}
                        className="pvtRowLabel"
                        rowSpan={x}
                        colSpan={
                          j === rowAttrs.length - 1 && colAttrs.length !== 0
                            ? 2
                            : 1
                        }
                        style={{
                          backgroundColor: banded ==="YES" && bandedColumn==="YES" && j%2===0 ? oddRowColor : evenRowColor,
                          borderBottom: borderStyle === "VH" || borderStyle === "V" ? `1px solid ${headerBgColor}` : "none",
                          borderLeft: borderStyle === "VH" || borderStyle === "H" ? `1px solid ${headerBgColor}` : "none",
                          borderRight: borderStyle === "VH" || borderStyle === "H" ? `1px solid ${headerBgColor}` : "none", }
                        }
                        
                      >
                        {txt}
                      </th>
                    );
                  })}
                  {colKeys.map(function(colKey, j) {
                    const aggregator = pivotData.getAggregator(rowKey, colKey);
                    return (
                      <td

                        className="pvtVal"
                        key={`pvtVal${i}-${j}`}
                        // onClick={
                        //   getClickHandler &&
                        //   getClickHandler(aggregator.value(), rowKey, colKey)
                        // }
                        style={Object.assign(
                          {},
                          valueCellColors(rowKey, colKey, aggregator.value()),
                          { backgroundColor: j%2===0 ? oddRowColor : evenRowColor,
                            borderBottom: borderStyle === "VH" || borderStyle === "V" ? `1px solid ${headerBgColor}` : "none",
                            borderLeft: borderStyle === "VH" || borderStyle === "H" ? `1px solid ${headerBgColor}` : "none",
                            borderRight: borderStyle === "VH" || borderStyle === "H" ? `1px solid ${headerBgColor}` : "none",
                          }
                        )}
                        
                      >
                        {aggregator.format(aggregator.value())}
                      </td>
                    );
                  })}
                  <td
                    className="pvtTotal"
                    // onClick={
                    //   getClickHandler &&
                    //   getClickHandler(totalAggregator.value(), rowKey, [null])
                    // }
                    style={{
                      colTotalColors: totalAggregator.value(),
                      borderBottom: borderStyle === "VH" || borderStyle === "V" ? `1px solid ${headerBgColor}` : "none",
                      borderLeft: borderStyle === "VH" || borderStyle === "H" ? `1px solid ${headerBgColor}` : "none",
                      borderRight: borderStyle === "VH" || borderStyle === "H" ? `1px solid ${headerBgColor}` : "none",
                    
                    }}
                    
                  >
                    {totalAggregator.format(totalAggregator.value())}
                  </td>
                </tr>
              );
            })}

            <tr>
              <th
                className="pvtTotalLabel"
                colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
              >
                Totals
              </th>

              {colKeys.map(function(colKey, i) {
                const totalAggregator = pivotData.getAggregator([], colKey);
                return (
                  <td
                    className="pvtTotal"
                    key={`total${i}`}
                    // onClick={
                    //   getClickHandler &&
                    //   getClickHandler(totalAggregator.value(), [null], colKey)
                    // }
                    style={rowTotalColors(totalAggregator.value())}
                  >
                    {totalAggregator.format(totalAggregator.value())}
                  </td>
                );
              })}

              <td
                // onClick={
                //   getClickHandler &&
                //   getClickHandler(grandTotalAggregator.value(), [null], [null])
                // }
                className="pvtGrandTotal"
              >
                {grandTotalAggregator.format(grandTotalAggregator.value())}
              </td>
            </tr>
          </tbody>
        </table>
      );
    }
  }

  TableRenderer.defaultProps = PivotData.defaultProps;
  TableRenderer.propTypes = PivotData.propTypes;
  TableRenderer.defaultProps.tableColorScaleGenerator = redColorScaleGenerator;
  TableRenderer.defaultProps.tableOptions = {};
  TableRenderer.propTypes.tableColorScaleGenerator = PropTypes.func;
  TableRenderer.propTypes.tableOptions = PropTypes.object;
  return TableRenderer;
}

class TSVExportRenderer extends React.PureComponent {
  render() {
    const pivotData = new PivotData(this.props);
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    if (rowKeys.length === 0) {
      rowKeys.push([]);
    }
    if (colKeys.length === 0) {
      colKeys.push([]);
    }

    const headerRow = pivotData.props.rows.map(r => r);
    if (colKeys.length === 1 && colKeys[0].length === 0) {
      headerRow.push(this.props.aggregatorName);
    } else {
      colKeys.map(c => headerRow.push(c.join('-')));
    }

    const result = rowKeys.map(r => {
      const row = r.map(x => x);
      colKeys.map(c => {
        const v = pivotData.getAggregator(r, c).value();
        row.push(v ? v : '');
      });
      return row;
    });

    result.unshift(headerRow);

    return (
      <textarea
        value={result.map(r => r.join('\t')).join('\n')}
        style={{width: window.innerWidth / 2, height: window.innerHeight / 2}}
        readOnly={true}
      />
    );
  }
}

TSVExportRenderer.defaultProps = PivotData.defaultProps;
TSVExportRenderer.propTypes = PivotData.propTypes;
export default {
  Table: makeRenderer(),
  'Table Heatmap': makeRenderer({heatmapMode: 'full'}),
  'Table Col Heatmap': makeRenderer({heatmapMode: 'col'}),
  'Table Row Heatmap': makeRenderer({heatmapMode: 'row'}),
  'Exportable TSV': TSVExportRenderer,
};
