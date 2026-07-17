import Car from "../../assets/Car.svg";

function PremiumCar({ size = 110 }) {
  return (
    <img
      src={Car}
      alt="Premium Car"
      draggable={false}
      style={{
        width: `${size}px`,
        height: "auto",
      }}
      className="
        select-none
        pointer-events-none
      "
    />
  );
}

export default PremiumCar;