class KeyframeSelector:
    def select(self, keyframes):
        """ Extract keyframes based on Suspicious Event """
        # Keyframes is a list of tuples (timestamp, frame_image)
        # To avoid duplicating heavily clustered events, we enforce a gap logic
        
        selected = []
        seen = set()
        
        for ts, frame in keyframes:
            # Group events occurring within the same literal second 
            second = int(ts)
            
            if second not in seen:
                seen.add(second)
                selected.append((ts, frame))
                
        return selected
