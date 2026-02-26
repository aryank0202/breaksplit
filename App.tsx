import AppNavigator from "./src/navigation/AppNavigator";
import {TripProvider} from "./src/state/TripStore";

export default function App() {
  return(
    <TripProvider>
      <AppNavigator />
    </TripProvider>
  );
}
