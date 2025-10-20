import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const Chart = ({ data }) => (
  <LineChart width={400} height={200} data={data}>
    <Line type="monotone" dataKey="valor" stroke="#82ca9d" />
    <XAxis dataKey="tiempo" />
    <YAxis />
    <Tooltip />
  </LineChart>
);