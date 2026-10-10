function InstructorStats() {
  const stats = [
    { number: "5.0★", label: "Google Rating" },
    { number: "133", label: "Reviews" },
    { number: "5,218", label: "Students" },
  ];

  return (
    <div className="mt-6 grid grid-cols-3 gap-3">

      {stats.map((item) => (

        <div
          key={item.label}
          className="
            rounded-xl
            border
            border-orange-100
            bg-white
            px-2
            py-3
            text-center
            shadow-sm
          "
        >

          <h3 className="text-lg font-black text-[#FF6201]">
            {item.number}
          </h3>

          <p className="mt-0.5 text-[11px] text-gray-500">
            {item.label}
          </p>

        </div>

      ))}

    </div>
  );
}

export default InstructorStats;
