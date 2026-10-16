function InstructorStats() {
  const stats = [
    { number: "5.0", star: true, label: "Google Rating" },
    { number: "136", label: "Reviews" },
    { number: "5,221", label: "Students" },
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
            <span className="font-dm-sans">{item.number}</span>
            {item.star && "★"}
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
