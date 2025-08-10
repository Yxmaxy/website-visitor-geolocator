import * as React from "react"
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    ScatterChart,
    Scatter,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    FunnelChart,
    Funnel,
    Sector,
} from "recharts"

import { cn } from "@/services/lib/shadcn-utils"
import "./custom-chart.css"

// Chart type configuration
type ChartType = 
    | "line" 
    | "area" 
    | "bar" 
    | "pie" 
    | "composed" 
    | "scatter" 
    | "radar" 
    | "funnel"

// Common chart props
interface BaseChartProps {
    data: any[]
    className?: string
    width?: string | number
    height?: number
    children?: React.ReactNode
}

// Line chart specific props
interface LineChartConfig {
    type: "line"
    dataKey: string
    stroke?: string
    strokeWidth?: number
    dot?: boolean | object
    area?: boolean
}

// Area chart specific props
interface AreaChartConfig {
    type: "area"
    dataKey: string
    fill?: string
    stroke?: string
    strokeWidth?: number
}

// Bar chart specific props
interface BarChartConfig {
    type: "bar"
    dataKey: string
    fill?: string
    stroke?: string
}

// Pie chart specific props
interface PieChartConfig {
    type: "pie"
    dataKey: string
    nameKey?: string
    colors?: string[]
}

// Union type for all chart configurations
type ChartConfig = 
    | LineChartConfig 
    | AreaChartConfig 
    | BarChartConfig 
    | PieChartConfig

// Main chart component props
interface CustomChartProps extends BaseChartProps {
    chartType: ChartType
    config: ChartConfig
    showGrid?: boolean
    showTooltip?: boolean
    showLegend?: boolean
    xAxisDataKey?: string
    yAxisWidth?: number
    xAxisAngle?: number
    xAxisHeight?: number
    tooltipStyle?: React.CSSProperties
}

// Default tooltip style matching your current styling
const defaultTooltipStyle: React.CSSProperties = {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    padding: "5px 8px",
    borderRadius: "5px",
    border: "1px solid var(--border)"
}

export function CustomChart({
    data,
    className,
    width = "100%",
    height = 300,
    chartType,
    config,
    showGrid = true,
    showTooltip = true,
    showLegend = false,
    xAxisDataKey = "period",
    yAxisWidth = 40,
    xAxisAngle = 0,
    xAxisHeight = 80,
    tooltipStyle = defaultTooltipStyle,
}: CustomChartProps) {
    const renderChartContent = () => {
        const commonProps = {
            data,
            className: cn("text-sm", className)
        }

        const commonAxisProps = {
            xAxis: xAxisDataKey ? (
                <XAxis
                    dataKey={xAxisDataKey}
                    angle={xAxisAngle}
                    textAnchor="end"
                    height={xAxisHeight}
                />
            ) : null,
            yAxis: <YAxis width={yAxisWidth} />,
            grid: showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null,
            tooltip: showTooltip ? (
                <Tooltip contentStyle={tooltipStyle} />
            ) : null,
            legend: showLegend ? <Legend /> : null,
        }

        switch (chartType) {
            case "line":
                const lineConfig = config as LineChartConfig
                return (
                    <LineChart {...commonProps}>
                        {commonAxisProps.grid}
                        {commonAxisProps.xAxis}
                        {commonAxisProps.yAxis}
                        {commonAxisProps.tooltip}
                        {commonAxisProps.legend}
                        <Line
                            type="monotone"
                            dataKey={lineConfig.dataKey}
                            stroke={lineConfig.stroke || "var(--chart-1)"}
                            strokeWidth={lineConfig.strokeWidth || 2}
                            dot={lineConfig.dot || false}
                        />
                    </LineChart>
                )

            case "area":
                const areaConfig = config as AreaChartConfig
                return (
                    <AreaChart {...commonProps}>
                        {commonAxisProps.grid}
                        {commonAxisProps.xAxis}
                        {commonAxisProps.yAxis}
                        {commonAxisProps.tooltip}
                        {commonAxisProps.legend}
                        <Area
                            type="monotone"
                            dataKey={areaConfig.dataKey}
                            fill={areaConfig.fill || "var(--chart-1)"}
                            stroke={areaConfig.stroke || "var(--chart-1)"}
                            strokeWidth={areaConfig.strokeWidth || 2}
                        />
                    </AreaChart>
                )

            case "bar":
                const barConfig = config as BarChartConfig
                return (
                    <BarChart {...commonProps}>
                        {commonAxisProps.grid}
                        {commonAxisProps.xAxis}
                        {commonAxisProps.yAxis}
                        {commonAxisProps.tooltip}
                        {commonAxisProps.legend}
                        <Bar
                            dataKey={barConfig.dataKey}
                            fill={barConfig.fill || "var(--chart-1)"}
                            stroke={barConfig.stroke || "var(--chart-1)"}
                        />
                    </BarChart>
                )

            case "pie":
                const pieConfig = config as PieChartConfig
                const colors = pieConfig.colors || [
                    "var(--chart-1)",
                    "var(--chart-2)",
                    "var(--chart-3)",
                    "var(--chart-4)",
                    "var(--chart-5)"
                ]
                return (
                    <PieChart {...commonProps}>
                        <Tooltip 
                            contentStyle={tooltipStyle}
                            formatter={(value, name) => [value, name]}
                            wrapperStyle={{
                                outline: 'none'
                            }}
                        />
                        {commonAxisProps.legend}
                        <Pie
                            data={data}
                            dataKey={pieConfig.dataKey}
                            nameKey={pieConfig.nameKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                )

            default:
                return null
        }
    }

    return (
        <ResponsiveContainer width={width} height={height}>
            {renderChartContent() as React.ReactElement}
        </ResponsiveContainer>
    )
}

// Export individual chart components for more granular control
export {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    ScatterChart,
    Scatter,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    FunnelChart,
    Funnel,
    Sector,
}
