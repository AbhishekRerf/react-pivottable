import React from 'react';
import tips from './tips';
import {sortAs} from '../src/Utilities';
import TableRenderers from '../src/TableRenderers';
import createPlotlyComponent from 'react-plotly.js/factory';
import createPlotlyRenderers from '../src/PlotlyRenderers';
import PivotTableUI from '../src/PivotTableUI';
import '../src/pivottable.css';
import Dropzone from 'react-dropzone';
import Papa from 'papaparse';

const Plot = createPlotlyComponent(window.Plotly);

class PivotTableUISmartWrapper extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {pivotState: props};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({pivotState: nextProps});
    }

    render() {
        return (
            <PivotTableUI
                renderers={Object.assign(
                    {},
                    TableRenderers,
                    createPlotlyRenderers(Plot)
                )}
                {...this.state.pivotState}
                onChange={s => this.setState({pivotState: s})}
                unusedOrientationCutoff={Infinity}
                
                options={{
                    "HEADER_BG_COLOR":"#2eb27a",
                    "HEADER_TEXT_COLOR":"#FFF",
                    "ODD_ROW_COLOR":"#FFF",
                    "EVEN_ROW_COLOR":"#d7f4e8",
                    "BORDER_STYLE":"VH",
                    "BANDED": "YES",
                    "BANDED_COL": "YES",
                    }}
            />
        );
    }
}

export default class App extends React.Component {
    componentWillMount() {
        this.setState({
            mode: 'demo',
            filename: 'Sample Dataset: Tips',
            pivotState: {
                data: tips,
                rows: ['Payer Gender','Payer Smoker'],
                cols: ['Party Size'],
                aggregatorName: 'Count',
                vals: ['Total Bill'],
                colOrder: 'value_a_to_z', // Add colOrder
                rowOrder: 'value_a_to_z', // Add rowOrder
                rendererName: 'Table',
               
                plotlyOptions: {width: 900, height: 500},
                plotlyConfig: {},
                tableOptions: {
                    clickCallback: function(e, value, filters, pivotData) {
                        var names = [];
                        pivotData.forEachMatchingRecord(filters, function(
                            record
                        ) {
                            names.push(record.Meal);
                        });
                        alert(names.join('\n'));
                    },
                },
                sortColumn: null,
                sortOrder: 'asc',
            },
        });
    }

    handleSort(column) {
        const { sortColumn, sortOrder, pivotState } = this.state;
        let newSortOrder = 'asc';
        if (sortColumn === column && sortOrder === 'asc') {
          newSortOrder = 'desc';
        }
      
        const sortedData = [...pivotState.data].sort((a, b) => {
          if (a[column] < b[column]) return newSortOrder === 'asc' ? -1 : 1;
          if (a[column] > b[column]) return newSortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      
        const updatedPivotState = Object.assign({}, pivotState, { data: sortedData });

  this.setState({
    pivotState: updatedPivotState,
    sortColumn: column,
    sortOrder: newSortOrder,
  });
          
      }
      
      
        
    onDrop(files) {
        this.setState(
            {
                mode: 'thinking',
                filename: '(Parsing CSV...)',
                textarea: '',
                pivotState: {data: []},
            },
            () =>
                Papa.parse(files[0], {
                    skipEmptyLines: true,
                    error: e => alert(e),
                    complete: parsed =>
                        this.setState({
                            mode: 'file',
                            filename: files[0].name,
                            pivotState: {data: parsed.data},
                        }),
                })
        );
    }

    onType(event) {
        Papa.parse(event.target.value, {
            skipEmptyLines: true,
            error: e => alert(e),
            complete: parsed =>
                this.setState({
                    mode: 'text',
                    filename: 'Data from <textarea>',
                    textarea: event.target.value,
                    pivotState: {data: parsed.data},
                }),
        });
    }

    render() {
        const { sortColumn, sortOrder } = this.state;
        const { tableOptions } = this.state.pivotState;
        
        const updatedTableOptions = Object.assign({}, tableOptions, {
          sortColumn,
          sortOrder,
          onSort: this.handleSort,
        });
      
        return (
            <div>
                    
                <div className="row">
                    <h2 className="text-center">{this.state.filename}</h2>
                    <br />

                    <PivotTableUISmartWrapper
          {...this.state.pivotState}
          tableOptions={updatedTableOptions}
        />
                </div>
            </div>
        );
    }
}
