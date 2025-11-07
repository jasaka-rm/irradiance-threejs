import { merge } from 'webpack-merge'
import commonConfiguration from './webpack.common.js'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'

module.exports = merge(
    commonConfiguration,
    {
        mode: 'production',
        plugins:
        [
            new CleanWebpackPlugin()
        ]
    }
)
