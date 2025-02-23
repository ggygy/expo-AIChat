import * as React from 'react';
import createIconSet from '@expo/vector-icons/createIconSet';
import { glyphMap, type IconNames } from '@/constants/IconType';

const CustomIconSet = createIconSet(glyphMap, 'Iconfont', 'iconfont.ttf');

interface CustomIconProps {
    name: IconNames;
    size?: number;
    color?: string;
    style?: any;
}

const CustomIcon: React.FC<CustomIconProps> = ({
    name,
    size = 24,
    color = '#000',
    style
}) => {
    return <CustomIconSet 
        name={name} 
        size={size} 
        color={color} 
        style={style}
    />;
}

export default CustomIcon;
