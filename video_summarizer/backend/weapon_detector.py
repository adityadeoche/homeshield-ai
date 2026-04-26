class WeaponDetector:
    def __init__(self):
        # Including common proxy classes for weapons. 
        # (For better accuracy, train and load a custom weapon detection model here)
        self.weapon_classes = ["knife", "baseball bat", "scissors", "gun"]
        
    @staticmethod
    def calculate_iou(boxA, boxB):
        # Determine the (x, y)-coordinates of the intersection rectangle
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        # Compute the area of intersection
        interArea = max(0, xB - xA) * max(0, yB - yA)

        if interArea == 0:
            return 0.0

        # Compute the area of both rectangles
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

        # Compute the intersection over union
        iou = interArea / float(boxAArea + boxBArea - interArea)
        return iou

    def check(self, tracked_objects, timestamp):
        events = []
        persons = [obj for obj in tracked_objects if obj["class_name"] == "person"]
        weapons = [obj for obj in tracked_objects if obj["class_name"] in self.weapon_classes]
        
        for person in persons:
            for weapon in weapons:
                iou = self.calculate_iou(person["bbox"], weapon["bbox"])
                if iou > 0.3:
                    events.append({
                        "event_type": "Armed Person Detected",
                        "type": "Armed Person Detected",
                        "severity": "HIGH",
                        "timestamp": timestamp,
                        "description": f"An armed person was detected holding a {weapon['class_name']}.",
                        "confidence": round(float(weapon.get("confidence", 0.95)), 2)
                    })
                    
        return events
