import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Collapsible } from '@/components/Collapsible';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Introduction</ThemedText>
        <ThemedText>
          This is an application that you can know where you are and find how to go to the place you want
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">How to use this application?</ThemedText>
      </ThemedView>
      <ThemedText>This is an application for user to recognize the location and do navigation.</ThemedText>

      <Collapsible title="Upload Function">
        <ThemedText>
          After you login, You can first upload the floor plan of a indoor area.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Navigation">
        <ThemedText>
          You can scan the location and the system will return the location where you are, you can set where you want to go and the system will guide you to there.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Register Account">
        <ThemedText>
          You can first register an account to use the upload function.
        </ThemedText>
      </Collapsible>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Who we are</ThemedText>
        <ThemedText>
          <ThemedText type="defaultSemiBold">We are Richard and Michael! This is our fyp project</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
