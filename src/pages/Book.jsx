import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { DockBar } from "./Dock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO, parse, addDays, startOfWeek } from "date-fns";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { DialogClose } from "@radix-ui/react-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_DAILY_BOOKING = 5;
const BOOKING_START_TIME = "06:00";
const BOOKING_END_TIME = "23:00";

const times = [
  // "00:00",
  // "00:30",
  // "01:00",
  // "01:30",
  // "02:00",
  // "02:30",
  // "03:00",
  // "03:30",
  // "04:00",
  // "04:30",
  // "05:00",
  // "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  // "23:30",
];

function Book() {
  const { toast } = useToast();

  const [data, setData] = useState({});
  const [selectedTime, setSelectedTime] = useState({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0.5);

  const [loading, setLoading] = useState(false);
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");

    axiosInstance
      .get(
        `/api/bookings/week-count?date=${today}&startOfWeek=true&startTime=${BOOKING_START_TIME}&endTime=${BOOKING_END_TIME}`
      )
      .then((response) => {
        setLoading(false);
        setData(response.data);
      });

    const todayDate = new Date();
    if (isNaN(todayDate)) {
      console.error("Invalid date");
    } else {
      const startOfCurrentWeek = startOfWeek(todayDate, { weekStartsOn: 1 });

      const weekDate = Array.from({ length: 7 }).map((_, index) =>
        format(new Date(addDays(startOfCurrentWeek, index)), "EEE, dd MMM")
      );

      setWeekDates(weekDate);
    }
  }, []);

  const dates = Object.keys(data);
  const firstDate = dates.length > 0 ? dates[0] : null;
  const timeSlots = firstDate ? Object.keys(data[firstDate] || {}) : [];

  function formatDate(dateString) {
    const date = parseISO(dateString);
    return format(date, "EEE, dd MMM");
  }

  function formatTime(timeString) {
    const time = parse(timeString, "HH:mm", new Date());
    return format(time, "h:mm a");
  }

  function formatDateTime({ date, time }) {
    if (!date || !time) return "";
    const dateTimeString = `${date}T${time}:00`;
    const dateTime = new Date(parseISO(dateTimeString));
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const formattedDate = new Intl.DateTimeFormat("en-GB", options).format(
      dateTime
    );

    return formattedDate.replace(/(am|pm)/g, (match) => match.toUpperCase());
  }

  function getColor(value, isDisabled) {
    if (isDisabled) {
      return "bg-gray-500";
    }
    switch (value) {
      case 0:
        return "bg-gray-100";
      case 1:
        return "bg-blue-200";
      case 2:
        return "bg-green-200";
      case 3:
        return "bg-yellow-300";
      case 4:
        return "bg-orange-300";
      default:
        return "bg-red-300";
    }
  }

  function convertToISO({ date, time }) {
    const dateTimeString = `${date}T${time}:00`;
    return dateTimeString;
  }

  async function bookSlot() {
    const date = convertToISO(selectedTime);
    const duration = selectedTimeSlot;

    try {
      const response = await axiosInstance.post("/api/bookings", {
        date,
        duration,
      });

      if (response.status === 201) {
        toast({
          title: "Booking",
          description: "Booking successful",
        });

        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Booking Failed",
        description: `${error.response.data.error}`,
        variant: "destructive",
      });
    }
  }

  function getAvailableTimeSlots(date, time) {
    const bookingDateTime = parseISO(`${date}T${time}`);
    const endTime = parse(BOOKING_END_TIME, "HH:mm", bookingDateTime);
    const availableHours =
      (endTime.getTime() - bookingDateTime.getTime()) / (1000 * 60 * 60);

    return [0.5, 1, 1.5, 2, 2.5, 3].filter((slot) => slot <= availableHours);
  }

  return (
    <div className="md:py-5 md:px-7 py-10 px-4">
      <main>
        <div className="flex items-center justify-center md:mb-3 mb-5">
          <h1 className="text-xl font-bold">Book</h1>
        </div>

        {/* DockBar */}
        <div className="fixed right-0 left-0 bottom-10">
          <DockBar />
        </div>

        <div className="flex justify-center ">
          <div className="">
            <div className="sticky z-0">
              <Table>
                <TableHeader className="">
                  <TableRow>
                    <TableHead className="w-24">Time</TableHead>
                    {loading
                      ? weekDates.map((date, index) => (
                          <TableHead key={index} className="w-24">
                            {date}
                          </TableHead>
                        ))
                      : dates.map((date) => (
                          <TableHead key={date} className="w-24">
                            {formatDate(date)}
                          </TableHead>
                        ))}
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
            <div className="md:h-[65vh] h-[70vh] overflow-auto">
              <Table>
                <TableBody>
                  {loading
                    ? times.map((time, rowIndex) => (
                        <TableRow key={rowIndex}>
                          <TableCell key={`time-${rowIndex}`} className="w-24">
                            {formatTime(time)}
                          </TableCell>
                          {Array.from({ length: 7 }).map((_, colIndex) => (
                            <TableCell key={colIndex} className="w-24">
                              <Skeleton className="md:h-[22px] h-[35px] w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : timeSlots.map((time) => (
                        <TableRow key={time}>
                          <TableCell className="w-24">
                            {formatTime(time)}
                          </TableCell>
                          {dates.map((date) => {
                            const cellValue = data[date][time];

                            return (
                              <td
                                key={date + time}
                                className="w-24 text-center"
                              >
                                {cellValue < MAX_DAILY_BOOKING ? (
                                  <Drawer>
                                    <DrawerTrigger
                                      asChild
                                      onClick={() =>
                                        setSelectedTime({ date, time })
                                      }
                                    >
                                      <TableCell
                                        className={`w-24 text-center ${
                                          cellValue < MAX_DAILY_BOOKING
                                            ? "cursor-pointer"
                                            : "cursor-not-allowed"
                                        } ${getColor(cellValue)}`}
                                      >
                                        {cellValue}
                                      </TableCell>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                      <div className="mx-auto w-full max-w-sm">
                                        <DrawerHeader>
                                          <DrawerTitle>Booking</DrawerTitle>
                                          <DrawerDescription>
                                            Set your booking
                                          </DrawerDescription>
                                        </DrawerHeader>
                                        <div className="p-4 flex flex-col gap-3">
                                          <h5>
                                            {formatDateTime({ date, time })}
                                          </h5>
                                          <Separator />
                                          <div>
                                            <ToggleGroup
                                              type="single"
                                              className="grid grid-cols-3 gap-3"
                                              defaultValue={selectedTimeSlot}
                                              onValueChange={
                                                setSelectedTimeSlot
                                              }
                                            >
                                              {getAvailableTimeSlots(
                                                date,
                                                time
                                              ).map((slot, index) => (
                                                <ToggleGroupItem
                                                  value={slot}
                                                  key={index}
                                                >
                                                  {slot} Hour
                                                </ToggleGroupItem>
                                              ))}
                                            </ToggleGroup>
                                          </div>
                                        </div>
                                        <DrawerFooter>
                                          <Dialog>
                                            <DialogTrigger
                                              disabled={
                                                selectedTimeSlot === null ||
                                                selectedTimeSlot === 0 ||
                                                selectedTimeSlot ===
                                                  undefined ||
                                                selectedTimeSlot === ""
                                              }
                                            >
                                              <Button
                                                className="w-full"
                                                disabled={
                                                  selectedTimeSlot === null ||
                                                  selectedTimeSlot === 0 ||
                                                  selectedTimeSlot ===
                                                    undefined ||
                                                  selectedTimeSlot === ""
                                                }
                                              >
                                                Book
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>
                                                  Are you absolutely sure?
                                                </DialogTitle>
                                                <DialogDescription>
                                                  <div className="pt-2">
                                                    You are about to book{" "}
                                                    {formatDateTime({
                                                      date,
                                                      time,
                                                    })}{" "}
                                                    {selectedTimeSlot} for Hour.
                                                  </div>
                                                  <div className="w-full flex items-end justify-end">
                                                    <DrawerClose>
                                                      <DialogClose asChild>
                                                        <Button
                                                          className="mt-2"
                                                          onClick={bookSlot}
                                                        >
                                                          Confirm
                                                        </Button>
                                                      </DialogClose>
                                                    </DrawerClose>
                                                  </div>
                                                </DialogDescription>
                                              </DialogHeader>
                                            </DialogContent>
                                          </Dialog>
                                          <DrawerClose asChild>
                                            <Button variant="outline">
                                              Cancel
                                            </Button>
                                          </DrawerClose>
                                        </DrawerFooter>
                                      </div>
                                    </DrawerContent>
                                  </Drawer>
                                ) : (
                                  <TableCell
                                    className={`w-24 text-center cursor-not-allowed ${getColor(
                                      cellValue
                                    )}`}
                                  >
                                    {cellValue}
                                  </TableCell>
                                )}
                              </td>
                            );
                          })}
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Book;