import React, { type ChangeEvent } from 'react'
import { Textarea } from './ui/textarea.tsx'

interface TableInputProps {
	tableData: string[][]
	handleTableChange: (
		event: ChangeEvent<HTMLTextAreaElement>,
		rowIndex: number,
		columnIndex: number,
	) => void
}

const TableInput: React.FC<TableInputProps> = ({
	tableData,
	handleTableChange,
}) => (
	<table className="w-full divide-y divide-gray-200">
		<tbody className="divide-y divide-gray-200 bg-white">
			{tableData.map((row, rowIndex) => (
				<tr key={rowIndex}>
					{row.map((column, columnIndex) => (
						<td
							key={columnIndex}
							className="whitespace-nowrap border-2 px-6 py-4"
						>
							<Textarea
								value={column}
								onChange={e => handleTableChange(e, rowIndex, columnIndex)}
								className="border border-gray-300/75 "
								name={`cell-${rowIndex}-${columnIndex}`}
							/>
						</td>
					))}
				</tr>
			))}
		</tbody>
	</table>
)

export default TableInput
