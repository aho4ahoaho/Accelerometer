import { StyleSheet, Text, Button, View } from 'react-native';
import { Accelerometer, type AccelerometerMeasurement, } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Subscription } from "expo-modules-core";

const Gravity = 9.81;
type Velocity = {
    x: number;
    y: number;
}
export const AccelerometerView = () => {
    const [rawdata, setRawData] = useState<AccelerometerMeasurement>({ x: 0, y: 0, z: 0 }); //g センサーからの生データ
    const [adjustData, setAdjustData] = useState<AccelerometerMeasurement>({ x: 0, y: 0, z: 0 }); //g 補正用のデータ
    const [data, setData] = useState<AccelerometerMeasurement>({ x: 0, y: 0, z: 0 }); //m/s^2 補正後のデータ

    const [velocity, setVelocity] = useState<Velocity>({ x: 0, y: 0 }); //m/s 速度
    const [interval, setInterval] = useState<number>(200); //ms 更新間隔
    const subscription = useRef<Subscription | null>(null);

    useEffect(() => {

        const newData = {
            x: (rawdata.x - adjustData.x) * Gravity,
            y: (rawdata.y - adjustData.y) * Gravity,
            z: (rawdata.z - adjustData.z) * Gravity
        }
        setData(newData);
    }, [rawdata, adjustData]);

    useEffect(() => {
        Accelerometer.setUpdateInterval(interval);
    }, [interval]);

    useEffect(() => {
        const dx = Math.abs(data.x) > 0.25 ? data.x * interval / 1000 : 0;
        const dy = Math.abs(data.y) > 0.25 ? data.y * interval / 1000 : 0;
        setVelocity(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
        }));
    }, [subscription.current, interval, data]);

    const onStart = useCallback(() => {
        //AccelerometerMeasurementはg単位での加速度を表す
        subscription.current = Accelerometer.addListener(setRawData);
        return () => {
            subscription.current?.remove();
            subscription.current = null;
        }
    }, [subscription.current, setRawData]);

    const onStop = useCallback(() => {
        subscription.current?.remove();
        subscription.current = null;
    }, [subscription.current]);

    const onReset = useCallback(() => {
        setVelocity({ x: 0, y: 0 });
        setAdjustData(rawdata);
        setData({ x: 0, y: 0, z: 0 });
    }, [rawdata, setAdjustData, setData, setVelocity]);

    return (
        <View style={styles.container}>
            <View style={styles.vertical}>
                <Text>加速度</Text>
                <View style={styles.horizontal}>
                    <Text>X: {formatValue(data.x)}㎨</Text>
                    <Text>Y: {formatValue(data.y)}㎨</Text>
                    <Text>Z: {formatValue(data.z)}㎨</Text>
                </View>
            </View>
            <View style={styles.vertical}>
                <Text>速度</Text>
                <View style={styles.horizontal}>
                    <Text>X: {formatValue(velocity.x)}m/s</Text>
                    <Text>Y: {formatValue(velocity.y)}m/s</Text>
                </View>
            </View>
            <View style={styles.vertical}>
                <Text>更新間隔</Text>
                <View style={styles.horizontal}>
                    <Button title='-50ms' onPress={() => setInterval((prev) => prev <= 50 ? 50 : prev - 50)} />
                    <Text>{interval}ms</Text>
                    <Button title='+50ms' onPress={() => setInterval((prev) => prev + 50)} />
                </View>
            </View>
            <View >
                <Text>安定した位置に設置して</Text>
                <Text>リセットボタンを押してください</Text>
                <Button title='リセット' onPress={onReset} />
            </View>
            <View style={styles.horizontal}>
                <View style={styles.buttonContainer}>
                    <Button title="開始" onPress={onStart} />
                </View>
                <View style={styles.buttonContainer}>
                    <Button title="停止" onPress={onStop} />
                </View>
            </View>
        </View>
    )
}

const formatValue = (value: number) => {
    //整数部
    const integer = Math.floor(value);
    //小数部 2桁まで
    const decimal = Math.round((value - integer) * 100);
    //符号
    const sign = value >= 0 ? '+' : '';
    return sign + integer.toString().padStart(2, "0") + '.' + decimal.toString().padStart(2, '0');
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    vertical: {
        display: 'flex',
        flexDirection: 'column',
        width: "100%",
        alignItems: 'center',
    },
    horizontal: {
        display: 'flex',
        flexDirection: 'row',
        gap: 20,
        width: "100%",
        alignItems: 'center',
    },
    buttonContainer: {
        width: 120,
    }
});