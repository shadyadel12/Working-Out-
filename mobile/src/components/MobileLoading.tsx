import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

const variants = {
  launch: { icon: "flash-outline", title: "Powering your session", colors: [colors.accent, colors.accentSoft] },
  player: { icon: "barbell-outline", title: "Preparing your program", colors: [colors.accent, colors.warning] },
  coach: { icon: "people-outline", title: "Loading your athletes", colors: ["#23c4a8", "#246bfe"] },
} as const;

export default function MobileLoading({ variant = "launch" }: { variant?: keyof typeof variants }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const config = variants[variant];
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 450, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse]);
  return <View accessibilityRole="progressbar" accessibilityLabel={config.title} style={styles.root}>
    <View style={[styles.orb, styles.one, { backgroundColor: config.colors[0] }]} />
    <View style={[styles.orb, styles.two, { backgroundColor: config.colors[1] }]} />
    <Animated.View style={[styles.ring, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] }) }], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.55, 1] }) }]}>
      <Ionicons name={config.icon} size={34} color={colors.text} />
    </Animated.View>
    <Image source={require('../../assets/trainova-wordmark.jpeg')} resizeMode="contain" accessibilityLabel="Trainova" style={styles.logo} /><Text style={styles.copy}>{config.title}</Text>
    <View style={styles.track}><Animated.View style={[styles.progress, { backgroundColor: config.colors[0], transform: [{ scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [.25, 1] }) }] }]} /></View>
  </View>;
}
const styles = StyleSheet.create({root:{flex:1,backgroundColor:colors.background,alignItems:"center",justifyContent:"center",overflow:"hidden",gap:10},orb:{position:"absolute",width:300,height:300,borderRadius:150,opacity:.2},one:{top:-130,right:-100},two:{bottom:-130,left:-100},ring:{width:88,height:88,borderRadius:44,alignItems:"center",justifyContent:"center",backgroundColor:colors.surfaceRaised,borderWidth:1,borderColor:colors.border},logo:{width:230,height:92},copy:{color:colors.muted,fontSize:14},track:{width:140,height:3,borderRadius:2,backgroundColor:colors.surfaceSoft,overflow:"hidden",marginTop:10},progress:{width:"100%",height:"100%"}});
